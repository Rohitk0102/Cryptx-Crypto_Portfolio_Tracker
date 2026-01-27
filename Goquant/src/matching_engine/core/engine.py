"""Core matching engine implementation."""

from decimal import Decimal
from datetime import datetime
from typing import List, Optional
import asyncio

from .models import Order, Trade, OrderType, Side, OrderStatus, OrderResult
from .order_book import OrderBook, PriceLevel
from .exceptions import OrderValidationError, InsufficientLiquidityError


class MatchingEngine:
    """
    Core matching engine implementing price-time priority matching.
    
    Processes orders sequentially to ensure deterministic matching
    and prevent race conditions.
    """
    
    def __init__(
        self,
        enable_persistence: bool = False,
        snapshot_interval: int = 60,
        enable_fees: bool = False,
        maker_fee_rate: Decimal = Decimal("0.001"),
        taker_fee_rate: Decimal = Decimal("0.002")
    ):
        """
        Initialize matching engine.
        
        Args:
            enable_persistence: Enable automatic snapshots
            snapshot_interval: Seconds between automatic snapshots
            enable_fees: Enable fee calculation
            maker_fee_rate: Maker fee rate (default 0.1%)
            taker_fee_rate: Taker fee rate (default 0.2%)
        """
        self.order_books: dict[str, OrderBook] = {}
        self.trade_id_counter = 0
        self.order_id_counter = 0
        self.order_queue: asyncio.Queue = asyncio.Queue()
        self.running = False
        
        # Stop orders waiting to be triggered
        self.stop_orders: dict[str, list[Order]] = {}  # symbol -> list of stop orders
        
        # Persistence
        self.enable_persistence = enable_persistence
        self.snapshot_interval = snapshot_interval
        self.last_snapshot_time = None
        self.snapshot_manager = None
        
        if enable_persistence:
            from ..persistence.snapshot import OrderBookSnapshot
            self.snapshot_manager = OrderBookSnapshot()
        
        # Fee calculation
        self.enable_fees = enable_fees
        self.fee_calculator = None
        
        if enable_fees:
            from ..utils.fees import FeeCalculator
            self.fee_calculator = FeeCalculator(maker_fee_rate, taker_fee_rate)
        
        # Publishers (will be set by dependency injection)
        self.market_data_publisher = None
        self.trade_publisher = None
        self.logger = None
    
    def set_publishers(self, market_data_publisher, trade_publisher):
        """
        Set market data and trade publishers.
        
        Args:
            market_data_publisher: Publisher for BBO and order book updates
            trade_publisher: Publisher for trade executions
        """
        self.market_data_publisher = market_data_publisher
        self.trade_publisher = trade_publisher
    
    def set_logger(self, logger):
        """
        Set logger instance.
        
        Args:
            logger: Structured logger
        """
        self.logger = logger
    
    def get_or_create_order_book(self, symbol: str) -> OrderBook:
        """
        Get existing order book or create new one for symbol.
        
        Args:
            symbol: Trading pair symbol
            
        Returns:
            OrderBook for the symbol
        """
        if symbol not in self.order_books:
            self.order_books[symbol] = OrderBook(symbol)
        return self.order_books[symbol]
    
    def generate_order_id(self) -> str:
        """
        Generate unique order ID.
        
        Returns:
            Unique order ID string
        """
        self.order_id_counter += 1
        return f"ORD-{self.order_id_counter:010d}"
    
    def generate_trade_id(self) -> str:
        """
        Generate unique trade ID.
        
        Returns:
            Unique trade ID string
        """
        self.trade_id_counter += 1
        return f"TRD-{self.trade_id_counter:010d}"
    
    def check_stop_orders(self, symbol: str, last_trade_price: Decimal):
        """
        Check if any stop orders should be triggered based on last trade price.
        
        Args:
            symbol: Trading symbol
            last_trade_price: Price of last trade execution
        """
        if symbol not in self.stop_orders:
            return
        
        triggered_orders = []
        
        for stop_order in self.stop_orders[symbol][:]:
            should_trigger = False
            
            if stop_order.order_type == OrderType.STOP_LOSS:
                # Stop-loss buy triggers when price goes above stop_price
                # Stop-loss sell triggers when price goes below stop_price
                if stop_order.side == Side.BUY:
                    should_trigger = last_trade_price >= stop_order.stop_price
                else:
                    should_trigger = last_trade_price <= stop_order.stop_price
            
            elif stop_order.order_type == OrderType.STOP_LIMIT:
                # Same trigger logic as stop-loss
                if stop_order.side == Side.BUY:
                    should_trigger = last_trade_price >= stop_order.stop_price
                else:
                    should_trigger = last_trade_price <= stop_order.stop_price
            
            elif stop_order.order_type == OrderType.TAKE_PROFIT:
                # Take-profit buy triggers when price goes below stop_price
                # Take-profit sell triggers when price goes above stop_price
                if stop_order.side == Side.BUY:
                    should_trigger = last_trade_price <= stop_order.stop_price
                else:
                    should_trigger = last_trade_price >= stop_order.stop_price
            
            if should_trigger:
                stop_order.is_triggered = True
                triggered_orders.append(stop_order)
                self.stop_orders[symbol].remove(stop_order)
                
                if self.logger:
                    self.logger.info(
                        "stop_order_triggered",
                        order_id=stop_order.order_id,
                        order_type=stop_order.order_type.value,
                        stop_price=str(stop_order.stop_price),
                        trigger_price=str(last_trade_price)
                    )
        
        # Process triggered orders (convert and match directly to avoid recursion)
        for triggered_order in triggered_orders:
            original_type = triggered_order.order_type
            
            if original_type == OrderType.STOP_LOSS:
                # Convert to market order
                triggered_order.order_type = OrderType.MARKET
                triggered_order.price = None
            elif original_type == OrderType.STOP_LIMIT:
                # Convert to limit order
                triggered_order.order_type = OrderType.LIMIT
            elif original_type == OrderType.TAKE_PROFIT:
                # Convert to limit order at stop_price
                triggered_order.order_type = OrderType.LIMIT
                if triggered_order.price is None:
                    triggered_order.price = triggered_order.stop_price
            
            # Match the triggered order directly
            order_book = self.get_or_create_order_book(triggered_order.symbol)
            trades = self.match_order(triggered_order, order_book)
            
            # Handle remaining quantity
            if triggered_order.remaining_quantity > 0 and triggered_order.can_rest_on_book():
                self.add_to_book(triggered_order, order_book)
    
    def process_order(self, order: Order) -> OrderResult:
        """
        Main entry point for order processing.
        
        Handles different order types:
        - MARKET: Match all available liquidity, cancel remainder
        - LIMIT: Match at limit price or better, rest remainder on book
        - IOC: Match available liquidity immediately, cancel remainder
        - FOK: Check if fully fillable, execute atomically or cancel
        
        Args:
            order: Order to process
            
        Returns:
            OrderResult with execution details
            
        Raises:
            InsufficientLiquidityError: If FOK order cannot be filled
        """
        order_book = self.get_or_create_order_book(order.symbol)
        
        # Log order submission
        if self.logger:
            self.logger.info(
                "order_submitted",
                order_id=order.order_id,
                symbol=order.symbol,
                order_type=order.order_type.value,
                side=order.side.value,
                quantity=str(order.quantity),
                price=str(order.price) if order.price else None,
                stop_price=str(order.stop_price) if order.stop_price else None
            )
        
        # Handle stop orders - add to stop order list
        if order.order_type in [OrderType.STOP_LOSS, OrderType.STOP_LIMIT, OrderType.TAKE_PROFIT]:
            if order.symbol not in self.stop_orders:
                self.stop_orders[order.symbol] = []
            self.stop_orders[order.symbol].append(order)
            
            return OrderResult(
                order_id=order.order_id,
                status="pending",
                timestamp=datetime.utcnow(),
                message=f"{order.order_type.value} order waiting for trigger at {order.stop_price}"
            )
        
        # Handle FOK order - check if fully fillable first
        if order.order_type == OrderType.FOK:
            if not self._can_fill_fok(order, order_book):
                order.status = OrderStatus.CANCELLED
                if self.logger:
                    self.logger.info(
                        "order_cancelled",
                        order_id=order.order_id,
                        symbol=order.symbol,
                        reason="FOK order cannot be completely filled"
                    )
                return OrderResult(
                    order_id=order.order_id,
                    status="cancelled",
                    timestamp=datetime.utcnow(),
                    message="Insufficient liquidity for FOK order",
                    remaining_quantity=order.quantity
                )
        
        # Match order against order book
        trades = self.match_order(order, order_book)
        
        # Determine final status
        if order.is_filled():
            status = "filled"
        elif order.remaining_quantity < order.quantity:
            status = "partial"
        else:
            status = "new"
        
        # Handle remaining quantity based on order type
        if order.remaining_quantity > 0:
            if order.order_type == OrderType.LIMIT:
                # Limit order: rest remainder on book
                self.add_to_book(order, order_book)
                status = "accepted" if not trades else "partial"
            else:
                # Market, IOC, FOK: cancel remainder
                order.status = OrderStatus.CANCELLED
                if self.logger:
                    self.logger.info(
                        "order_cancelled",
                        order_id=order.order_id,
                        symbol=order.symbol,
                        reason=f"Unfilled {order.order_type.value} order"
                    )
        
        result = OrderResult(
            order_id=order.order_id,
            status=status,
            timestamp=datetime.utcnow(),
            trades=trades,
            remaining_quantity=order.remaining_quantity
        )
        
        # Check if snapshot is needed
        if self.enable_persistence:
            self._check_snapshot()
        
        return result
    
    def _can_fill_fok(self, order: Order, order_book: OrderBook) -> bool:
        """
        Check if FOK order can be completely filled.
        
        Args:
            order: FOK order to check
            order_book: Order book to check against
            
        Returns:
            True if order can be completely filled
        """
        # Get opposite side of book
        if order.side == Side.BUY:
            price_levels = order_book.asks
        else:
            price_levels = order_book.bids
        
        available_quantity = Decimal("0")
        remaining_to_fill = order.quantity
        
        # Check available liquidity at acceptable prices
        for price, level in price_levels.items():
            # Check if we can match at this price
            if not self._can_match(order, price):
                break
            
            # Add available quantity at this level
            fillable = min(remaining_to_fill, level.total_quantity)
            available_quantity += fillable
            remaining_to_fill -= fillable
            
            if remaining_to_fill == 0:
                return True
        
        return remaining_to_fill == 0
    
    def match_order(self, order: Order, order_book: OrderBook) -> List[Trade]:
        """
        Match incoming order against order book using price-time priority.
        
        Args:
            order: Incoming order to match
            order_book: Order book to match against
            
        Returns:
            List of executed trades
        """
        trades = []
        
        # Get opposite side of book
        if order.side == Side.BUY:
            price_levels = order_book.asks
        else:
            price_levels = order_book.bids
        
        # Store BBO before matching for comparison
        old_bbo = order_book.calculate_bbo()
        
        # Iterate through price levels in priority order
        while order.remaining_quantity > 0 and price_levels:
            # Get best price
            if order.side == Side.BUY:
                best_price = price_levels.keys()[0]  # Lowest ask
            else:
                best_price = price_levels.keys()[0]  # Highest bid
            
            # Check if order can match at this price
            if not self._can_match(order, best_price):
                break
            
            price_level = price_levels[best_price]
            
            # Match against orders at this price level (FIFO)
            while order.remaining_quantity > 0 and price_level.orders:
                resting_order = price_level.orders[0]
                
                # Calculate fill quantity
                fill_qty = min(order.remaining_quantity, resting_order.remaining_quantity)
                
                # Create trade
                trade = self._create_trade(
                    taker_order=order,
                    maker_order=resting_order,
                    price=best_price,
                    quantity=fill_qty
                )
                trades.append(trade)
                
                # Update quantities
                old_taker_qty = order.remaining_quantity
                order.remaining_quantity -= fill_qty
                order.update_status()
                
                old_maker_qty = resting_order.remaining_quantity
                resting_order.remaining_quantity -= fill_qty
                resting_order.update_status()
                
                # Update price level quantity
                price_level.update_quantity(old_maker_qty, resting_order.remaining_quantity)
                
                # Remove filled order from queue
                if resting_order.is_filled():
                    price_level.orders.popleft()
                    # Remove from order index
                    if resting_order.order_id in order_book.order_index:
                        del order_book.order_index[resting_order.order_id]
                
                # Log trade execution
                if self.logger:
                    self.logger.info(
                        "trade_executed",
                        trade_id=trade.trade_id,
                        symbol=trade.symbol,
                        price=str(trade.price),
                        quantity=str(trade.quantity),
                        maker_order_id=trade.maker_order_id,
                        taker_order_id=trade.taker_order_id,
                        aggressor_side=trade.aggressor_side.value
                    )
                
                # Publish trade
                if self.trade_publisher:
                    asyncio.create_task(self.trade_publisher.publish_trade(trade))
            
            # Remove empty price level
            if price_level.is_empty():
                del price_levels[best_price]
        
        # Publish BBO update if it changed
        if trades and self.market_data_publisher:
            new_bbo = order_book.calculate_bbo()
            if self._bbo_changed(old_bbo, new_bbo):
                asyncio.create_task(self.market_data_publisher.publish_bbo_update(order.symbol, new_bbo))
                asyncio.create_task(self.market_data_publisher.publish_orderbook_update(order.symbol, order_book))
        
        # Check stop orders after trades execute
        if trades:
            last_trade_price = trades[-1].price
            self.check_stop_orders(order.symbol, last_trade_price)
        
        return trades
    
    def _can_match(self, order: Order, price: Decimal) -> bool:
        """
        Check if order can match at given price (trade-through prevention).
        
        Args:
            order: Order to check
            price: Price level to check
            
        Returns:
            True if order can match at this price
        """
        if order.order_type == OrderType.MARKET:
            return True
        
        if order.side == Side.BUY:
            # Buy order can match if limit price >= ask price
            return order.price >= price
        else:
            # Sell order can match if limit price <= bid price
            return order.price <= price
    
    def _create_trade(
        self,
        taker_order: Order,
        maker_order: Order,
        price: Decimal,
        quantity: Decimal
    ) -> Trade:
        """
        Create trade execution record with fee calculation.
        
        Args:
            taker_order: Incoming order (aggressor)
            maker_order: Resting order (maker)
            price: Execution price
            quantity: Execution quantity
            
        Returns:
            Trade object with fees
        """
        trade = Trade(
            trade_id=self.generate_trade_id(),
            symbol=taker_order.symbol,
            price=price,
            quantity=quantity,
            timestamp=datetime.utcnow(),
            maker_order_id=maker_order.order_id,
            taker_order_id=taker_order.order_id,
            aggressor_side=taker_order.side
        )
        
        # Calculate fees if enabled
        if self.enable_fees and self.fee_calculator:
            trade_value = price * quantity
            maker_fee, taker_fee = self.fee_calculator.calculate_fees(trade_value)
            
            trade.maker_fee = maker_fee
            trade.taker_fee = taker_fee
            trade.maker_fee_rate = self.fee_calculator.maker_fee_rate
            trade.taker_fee_rate = self.fee_calculator.taker_fee_rate
        
        return trade
    
    def add_to_book(self, order: Order, order_book: OrderBook):
        """
        Add order to the order book.
        
        Args:
            order: Order to add
            order_book: Order book to add to
        """
        old_bbo = order_book.calculate_bbo()
        
        order_book.add_order(order)
        
        # Publish BBO update if it changed
        if self.market_data_publisher:
            new_bbo = order_book.calculate_bbo()
            if self._bbo_changed(old_bbo, new_bbo):
                asyncio.create_task(self.market_data_publisher.publish_bbo_update(order.symbol, new_bbo))
                asyncio.create_task(self.market_data_publisher.publish_orderbook_update(order.symbol, order_book))
    
    def cancel_order(self, order_id: str, symbol: str) -> bool:
        """
        Cancel an order.
        
        Args:
            order_id: ID of order to cancel
            symbol: Trading symbol
            
        Returns:
            True if order was cancelled
        """
        if symbol not in self.order_books:
            return False
        
        order_book = self.order_books[symbol]
        
        if not order_book.has_order(order_id):
            return False
        
        old_bbo = order_book.calculate_bbo()
        
        order = order_book.remove_order(order_id)
        order.status = OrderStatus.CANCELLED
        
        # Log cancellation
        if self.logger:
            self.logger.info(
                "order_cancelled",
                order_id=order_id,
                symbol=symbol,
                reason="User requested cancellation"
            )
        
        # Publish BBO update if it changed
        if self.market_data_publisher:
            new_bbo = order_book.calculate_bbo()
            if self._bbo_changed(old_bbo, new_bbo):
                asyncio.create_task(self.market_data_publisher.publish_bbo_update(symbol, new_bbo))
                asyncio.create_task(self.market_data_publisher.publish_orderbook_update(symbol, order_book))
        
        return True
    
    def _bbo_changed(self, old_bbo, new_bbo) -> bool:
        """
        Check if BBO has changed.
        
        Args:
            old_bbo: Previous BBO
            new_bbo: New BBO
            
        Returns:
            True if BBO changed
        """
        return (
            old_bbo.best_bid != new_bbo.best_bid or
            old_bbo.best_ask != new_bbo.best_ask or
            old_bbo.best_bid_quantity != new_bbo.best_bid_quantity or
            old_bbo.best_ask_quantity != new_bbo.best_ask_quantity
        )
    
    def _check_snapshot(self):
        """Check if automatic snapshot is needed."""
        if not self.snapshot_manager:
            return
        
        now = datetime.utcnow()
        
        if self.last_snapshot_time is None:
            self.last_snapshot_time = now
            return
        
        elapsed = (now - self.last_snapshot_time).total_seconds()
        
        if elapsed >= self.snapshot_interval:
            try:
                filepath = self.snapshot_manager.save_engine_state(self)
                self.last_snapshot_time = now
                
                if self.logger:
                    self.logger.info(
                        "snapshot_created",
                        filepath=filepath,
                        order_books=len(self.order_books)
                    )
            except Exception as e:
                if self.logger:
                    self.logger.error("snapshot_failed", error=str(e))
    
    def save_snapshot(self, filename: Optional[str] = None) -> str:
        """
        Manually save engine state snapshot.
        
        Args:
            filename: Optional filename
            
        Returns:
            Path to snapshot file
        """
        if not self.snapshot_manager:
            from ..persistence.snapshot import OrderBookSnapshot
            self.snapshot_manager = OrderBookSnapshot()
        
        return self.snapshot_manager.save_engine_state(self, filename)
    
    def load_snapshot(self, filepath: str):
        """
        Load engine state from snapshot.
        
        Args:
            filepath: Path to snapshot file
        """
        if not self.snapshot_manager:
            from ..persistence.snapshot import OrderBookSnapshot
            self.snapshot_manager = OrderBookSnapshot()
        
        self.snapshot_manager.load_engine_state(self, filepath)
        
        if self.logger:
            self.logger.info(
                "snapshot_loaded",
                filepath=filepath,
                order_books=len(self.order_books),
                trade_id_counter=self.trade_id_counter,
                order_id_counter=self.order_id_counter
            )
    
    def get_order_book_snapshot(self, symbol: str, levels: int = 10):
        """
        Get order book snapshot for a symbol.
        
        Args:
            symbol: Trading symbol
            levels: Number of price levels
            
        Returns:
            Order book snapshot or None
        """
        if symbol not in self.order_books:
            return None
        
        order_book = self.order_books[symbol]
        bids, asks = order_book.get_depth(levels)
        
        from .models import OrderBookSnapshot
        return OrderBookSnapshot(
            symbol=symbol,
            timestamp=datetime.utcnow(),
            bids=bids,
            asks=asks
        )
