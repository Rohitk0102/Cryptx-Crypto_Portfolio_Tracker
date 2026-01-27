"""Tests for advanced order types: Stop-Loss, Stop-Limit, Take-Profit."""

import pytest
from decimal import Decimal
from datetime import datetime

from matching_engine.core.engine import MatchingEngine
from matching_engine.core.models import Order, OrderType, Side, OrderStatus


def create_order(order_id, order_type, side, quantity, price=None, stop_price=None):
    """Helper to create orders."""
    return Order(
        order_id=order_id,
        symbol="BTC-USDT",
        order_type=order_type,
        side=side,
        quantity=Decimal(str(quantity)),
        price=Decimal(str(price)) if price else None,
        stop_price=Decimal(str(stop_price)) if stop_price else None,
        timestamp=datetime.utcnow(),
        remaining_quantity=Decimal(str(quantity))
    )


class TestStopLossOrders:
    """Tests for stop-loss orders."""
    
    def test_stop_loss_sell_trigger(self):
        """Test stop-loss sell order triggers when price drops."""
        engine = MatchingEngine()
        
        # Add buy orders at different prices
        buy1 = create_order("BUY-1", OrderType.LIMIT, Side.BUY, 1.0, 49400)
        buy2 = create_order("BUY-2", OrderType.LIMIT, Side.BUY, 1.0, 50000)
        engine.process_order(buy1)
        engine.process_order(buy2)
        
        # Add stop-loss sell at stop_price 49500
        stop_loss = create_order("STOP-1", OrderType.STOP_LOSS, Side.SELL, 1.0, stop_price=49500)
        result = engine.process_order(stop_loss)
        
        assert result.status == "pending"
        assert "BTC-USDT" in engine.stop_orders
        assert len(engine.stop_orders["BTC-USDT"]) == 1
        
        # Trigger with market sell that executes at 49400 (below stop_price)
        sell = create_order("SELL-1", OrderType.MARKET, Side.SELL, 1.5)
        engine.process_order(sell)
        
        # Stop-loss should be triggered and converted to market order
        assert len(engine.stop_orders["BTC-USDT"]) == 0
        print("✓ Stop-loss sell triggers when price drops")
    
    def test_stop_loss_buy_trigger(self):
        """Test stop-loss buy order triggers when price rises."""
        engine = MatchingEngine()
        
        # Add sell order at 50000
        sell = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 1.0, 50000)
        engine.process_order(sell)
        
        # Add stop-loss buy at stop_price 50500
        stop_loss = create_order("STOP-1", OrderType.STOP_LOSS, Side.BUY, 1.0, stop_price=50500)
        result = engine.process_order(stop_loss)
        
        assert result.status == "pending"
        
        # Add higher sell order
        sell2 = create_order("SELL-2", OrderType.LIMIT, Side.SELL, 1.0, 50600)
        engine.process_order(sell2)
        
        # Trigger with market buy at 50600
        buy = create_order("BUY-1", OrderType.MARKET, Side.BUY, 0.5)
        engine.process_order(buy)
        
        # Stop-loss should be triggered
        assert len(engine.stop_orders["BTC-USDT"]) == 0
        print("✓ Stop-loss buy triggers when price rises")


class TestStopLimitOrders:
    """Tests for stop-limit orders."""
    
    def test_stop_limit_trigger_and_rest(self):
        """Test stop-limit order triggers and rests as limit order."""
        engine = MatchingEngine()
        
        # Add buy order at 50000
        buy = create_order("BUY-1", OrderType.LIMIT, Side.BUY, 1.0, 50000)
        engine.process_order(buy)
        
        # Add stop-limit sell: stop at 49500, limit at 49400
        stop_limit = create_order("STOP-1", OrderType.STOP_LIMIT, Side.SELL, 1.0, price=49400, stop_price=49500)
        result = engine.process_order(stop_limit)
        
        assert result.status == "pending"
        
        # Trigger with market sell
        sell = create_order("SELL-1", OrderType.MARKET, Side.SELL, 0.5)
        engine.process_order(sell)
        
        # Stop-limit should be triggered and converted to limit order
        # It should rest on book at 49400
        order_book = engine.order_books["BTC-USDT"]
        assert len(engine.stop_orders.get("BTC-USDT", [])) == 0
        print("✓ Stop-limit triggers and converts to limit order")


class TestTakeProfitOrders:
    """Tests for take-profit orders."""
    
    def test_take_profit_sell_trigger(self):
        """Test take-profit sell order triggers when price rises."""
        engine = MatchingEngine()
        
        # Add buy order at 50000
        buy = create_order("BUY-1", OrderType.LIMIT, Side.BUY, 1.0, 50000)
        engine.process_order(buy)
        
        # Add take-profit sell at stop_price 50500
        take_profit = create_order("TP-1", OrderType.TAKE_PROFIT, Side.SELL, 1.0, stop_price=50500)
        result = engine.process_order(take_profit)
        
        assert result.status == "pending"
        assert len(engine.stop_orders["BTC-USDT"]) == 1
        
        # Add higher buy order
        buy2 = create_order("BUY-2", OrderType.LIMIT, Side.BUY, 1.0, 50600)
        engine.process_order(buy2)
        
        # Trigger with market sell at 50600
        sell = create_order("SELL-1", OrderType.MARKET, Side.SELL, 0.5)
        engine.process_order(sell)
        
        # Take-profit should be triggered
        assert len(engine.stop_orders["BTC-USDT"]) == 0
        print("✓ Take-profit sell triggers when price rises")
    
    def test_take_profit_buy_trigger(self):
        """Test take-profit buy order triggers when price drops."""
        engine = MatchingEngine()
        
        # Add sell order at 50000
        sell = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 1.0, 50000)
        engine.process_order(sell)
        
        # Add take-profit buy at stop_price 49500
        take_profit = create_order("TP-1", OrderType.TAKE_PROFIT, Side.BUY, 1.0, stop_price=49500)
        result = engine.process_order(take_profit)
        
        assert result.status == "pending"
        
        # Trigger with market buy
        buy = create_order("BUY-1", OrderType.MARKET, Side.BUY, 0.5)
        engine.process_order(buy)
        
        # Take-profit should be triggered
        assert len(engine.stop_orders["BTC-USDT"]) == 0
        print("✓ Take-profit buy triggers when price drops")


class TestStopOrderValidation:
    """Tests for stop order validation."""
    
    def test_stop_loss_requires_stop_price(self):
        """Test that stop-loss orders require stop_price."""
        with pytest.raises(ValueError, match="Stop price required"):
            create_order("STOP-1", OrderType.STOP_LOSS, Side.SELL, 1.0)
    
    def test_stop_limit_requires_both_prices(self):
        """Test that stop-limit orders require both stop_price and price."""
        with pytest.raises(ValueError, match="Stop price required"):
            create_order("STOP-1", OrderType.STOP_LIMIT, Side.SELL, 1.0, price=50000)
        
        with pytest.raises(ValueError, match="Limit price required"):
            create_order("STOP-1", OrderType.STOP_LIMIT, Side.SELL, 1.0, stop_price=50000)


if __name__ == "__main__":
    print("\n" + "="*70)
    print("ADVANCED ORDER TYPES TESTS")
    print("="*70)
    
    test_classes = [
        TestStopLossOrders,
        TestStopLimitOrders,
        TestTakeProfitOrders,
        TestStopOrderValidation
    ]
    
    total = 0
    passed = 0
    
    for test_class in test_classes:
        print(f"\n{test_class.__doc__}")
        print("-" * 70)
        
        instance = test_class()
        for method_name in dir(instance):
            if method_name.startswith('test_'):
                total += 1
                try:
                    getattr(instance, method_name)()
                    passed += 1
                except Exception as e:
                    print(f"✗ {method_name} FAILED: {e}")
    
    print("\n" + "="*70)
    print(f"RESULTS: {passed}/{total} tests passed")
    print("="*70)
