"""Market data simulator for testing and demonstration."""

import asyncio
import random
from decimal import Decimal
from datetime import datetime

from matching_engine.core.engine import MatchingEngine
from matching_engine.core.models import Order, OrderType, Side, OrderStatus
from matching_engine.publishers.websocket_manager import WebSocketManager
from matching_engine.publishers.market_data import MarketDataPublisher
from matching_engine.publishers.trade import TradePublisher
from matching_engine.utils.logging import configure_logging


class MarketDataSimulator:
    """Generate realistic order flow for testing."""
    
    def __init__(self, engine: MatchingEngine, base_price: Decimal = Decimal("50000")):
        """
        Initialize simulator.
        
        Args:
            engine: Matching engine instance
            base_price: Base price for order generation
        """
        self.engine = engine
        self.base_price = base_price
        self.order_counter = 0
    
    def generate_order_id(self) -> str:
        """Generate unique order ID."""
        self.order_counter += 1
        return f"SIM-{self.order_counter:010d}"
    
    def generate_random_order(self, symbol: str) -> Order:
        """
        Generate realistic random order.
        
        Args:
            symbol: Trading symbol
            
        Returns:
            Random order
        """
        # Random order type (weighted towards limit orders)
        order_type_choice = random.choices(
            [OrderType.MARKET, OrderType.LIMIT, OrderType.IOC, OrderType.FOK],
            weights=[0.2, 0.6, 0.15, 0.05]
        )[0]
        
        # Random side
        side = random.choice([Side.BUY, Side.SELL])
        
        # Random quantity (0.1 to 5.0)
        quantity = Decimal(str(round(random.uniform(0.1, 5.0), 2)))
        
        # Generate price with spread around base price
        if order_type_choice == OrderType.MARKET:
            price = None
        else:
            if side == Side.BUY:
                # Buy orders below base price
                price_offset = random.uniform(-200, -10)
            else:
                # Sell orders above base price
                price_offset = random.uniform(10, 200)
            
            price = self.base_price + Decimal(str(round(price_offset, 2)))
        
        return Order(
            order_id=self.generate_order_id(),
            symbol=symbol,
            order_type=order_type_choice,
            side=side,
            quantity=quantity,
            price=price,
            timestamp=datetime.utcnow(),
            remaining_quantity=quantity
        )
    
    async def simulate_trading_activity(
        self,
        symbol: str,
        orders_per_second: int,
        duration_seconds: int
    ):
        """
        Generate random orders at specified rate.
        
        Args:
            symbol: Trading symbol
            orders_per_second: Target order rate
            duration_seconds: Simulation duration
        """
        interval = 1.0 / orders_per_second
        total_orders = orders_per_second * duration_seconds
        
        print(f"Starting simulation: {orders_per_second} orders/sec for {duration_seconds}s")
        print(f"Total orders: {total_orders}")
        
        for i in range(total_orders):
            order = self.generate_random_order(symbol)
            self.engine.process_order(order)
            
            if (i + 1) % 100 == 0:
                print(f"Processed {i + 1}/{total_orders} orders...")
            
            await asyncio.sleep(interval)
        
        print(f"Simulation complete: {total_orders} orders processed")


async def main():
    """Run market data simulation."""
    # Configure logging
    logger = configure_logging(log_level="INFO", log_format="console")
    
    # Initialize components
    websocket_manager = WebSocketManager()
    websocket_manager.set_logger(logger)
    
    market_data_publisher = MarketDataPublisher(websocket_manager)
    trade_publisher = TradePublisher(websocket_manager)
    
    engine = MatchingEngine()
    engine.set_publishers(market_data_publisher, trade_publisher)
    engine.set_logger(logger)
    
    # Create simulator
    simulator = MarketDataSimulator(engine, base_price=Decimal("50000"))
    
    # Run simulation
    await simulator.simulate_trading_activity(
        symbol="BTC-USDT",
        orders_per_second=10,
        duration_seconds=30
    )
    
    # Print order book snapshot
    snapshot = engine.get_order_book_snapshot("BTC-USDT", levels=5)
    if snapshot:
        print("\n=== Order Book Snapshot ===")
        print(f"Symbol: {snapshot.symbol}")
        print("\nTop 5 Bids:")
        for price, qty in snapshot.bids:
            print(f"  {price}: {qty}")
        print("\nTop 5 Asks:")
        for price, qty in snapshot.asks:
            print(f"  {price}: {qty}")


if __name__ == "__main__":
    asyncio.run(main())
