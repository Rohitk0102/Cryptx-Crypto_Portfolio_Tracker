"""Unit tests for matching engine functionality."""

import pytest
from decimal import Decimal
from datetime import datetime

from matching_engine.core.engine import MatchingEngine
from matching_engine.core.models import Order, OrderType, Side, OrderStatus
from matching_engine.core.exceptions import InsufficientLiquidityError


@pytest.fixture
def engine():
    """Create a matching engine for testing."""
    return MatchingEngine()


@pytest.fixture
def symbol():
    """Trading symbol for tests."""
    return "BTC-USDT"


def create_order(order_id, order_type, side, quantity, price=None):
    """Helper to create orders."""
    return Order(
        order_id=order_id,
        symbol="BTC-USDT",
        order_type=order_type,
        side=side,
        quantity=Decimal(str(quantity)),
        price=Decimal(str(price)) if price else None,
        timestamp=datetime.utcnow(),
        remaining_quantity=Decimal(str(quantity))
    )


class TestMarketOrders:
    """Tests for market order matching."""
    
    def test_market_buy_full_fill(self, engine):
        """Test market buy order with full liquidity."""
        # Add sell orders to book
        sell1 = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 1.0, 50000)
        sell2 = create_order("SELL-2", OrderType.LIMIT, Side.SELL, 1.0, 50010)
        
        engine.process_order(sell1)
        engine.process_order(sell2)
        
        # Submit market buy
        buy = create_order("BUY-1", OrderType.MARKET, Side.BUY, 1.5)
        result = engine.process_order(buy)
        
        assert result.status == "filled"
        assert len(result.trades) == 2
        assert result.trades[0].price == Decimal("50000")
        assert result.trades[1].price == Decimal("50010")
    
    def test_market_sell_full_fill(self, engine):
        """Test market sell order with full liquidity."""
        # Add buy orders to book
        buy1 = create_order("BUY-1", OrderType.LIMIT, Side.BUY, 1.0, 50000)
        buy2 = create_order("BUY-2", OrderType.LIMIT, Side.BUY, 1.0, 49990)
        
        engine.process_order(buy1)
        engine.process_order(buy2)
        
        # Submit market sell
        sell = create_order("SELL-1", OrderType.MARKET, Side.SELL, 1.5)
        result = engine.process_order(sell)
        
        assert result.status == "filled"
        assert len(result.trades) == 2
        assert result.trades[0].price == Decimal("50000")  # Best bid first
        assert result.trades[1].price == Decimal("49990")
    
    def test_market_order_partial_fill(self, engine):
        """Test market order with insufficient liquidity."""
        # Add limited liquidity
        sell = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 1.0, 50000)
        engine.process_order(sell)
        
        # Submit larger market buy
        buy = create_order("BUY-1", OrderType.MARKET, Side.BUY, 2.0)
        result = engine.process_order(buy)
        
        assert len(result.trades) == 1
        assert result.trades[0].quantity == Decimal("1.0")
        assert result.remaining_quantity == Decimal("1.0")


class TestLimitOrders:
    """Tests for limit order matching."""
    
    def test_limit_buy_immediate_match(self, engine):
        """Test limit buy that matches immediately."""
        # Add sell order
        sell = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 1.0, 50000)
        engine.process_order(sell)
        
        # Submit limit buy at or above ask
        buy = create_order("BUY-1", OrderType.LIMIT, Side.BUY, 1.0, 50000)
        result = engine.process_order(buy)
        
        assert result.status == "filled"
        assert len(result.trades) == 1
        assert result.trades[0].price == Decimal("50000")
    
    def test_limit_sell_immediate_match(self, engine):
        """Test limit sell that matches immediately."""
        # Add buy order
        buy = create_order("BUY-1", OrderType.LIMIT, Side.BUY, 1.0, 50000)
        engine.process_order(buy)
        
        # Submit limit sell at or below bid
        sell = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 1.0, 50000)
        result = engine.process_order(sell)
        
        assert result.status == "filled"
        assert len(result.trades) == 1
        assert result.trades[0].price == Decimal("50000")
    
    def test_limit_order_rests_on_book(self, engine):
        """Test limit order that doesn't match rests on book."""
        # Submit limit buy below market
        buy = create_order("BUY-1", OrderType.LIMIT, Side.BUY, 1.0, 49000)
        result = engine.process_order(buy)
        
        assert result.status == "accepted"
        assert len(result.trades) == 0
        
        # Verify order is on book
        order_book = engine.order_books["BTC-USDT"]
        assert order_book.has_order("BUY-1")
    
    def test_limit_order_partial_match_rest(self, engine):
        """Test limit order partial match with remainder resting."""
        # Add partial liquidity
        sell = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 0.5, 50000)
        engine.process_order(sell)
        
        # Submit larger limit buy
        buy = create_order("BUY-1", OrderType.LIMIT, Side.BUY, 1.0, 50000)
        result = engine.process_order(buy)
        
        assert result.status == "partial"
        assert len(result.trades) == 1
        assert result.trades[0].quantity == Decimal("0.5")
        
        # Verify remainder is on book
        order_book = engine.order_books["BTC-USDT"]
        assert order_book.has_order("BUY-1")
        order = order_book.get_order("BUY-1")
        assert order.remaining_quantity == Decimal("0.5")


class TestIOCOrders:
    """Tests for IOC (Immediate-Or-Cancel) orders."""
    
    def test_ioc_full_fill(self, engine):
        """Test IOC order with full liquidity."""
        # Add sell orders
        sell = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 1.0, 50000)
        engine.process_order(sell)
        
        # Submit IOC buy
        buy = create_order("BUY-1", OrderType.IOC, Side.BUY, 1.0, 50000)
        result = engine.process_order(buy)
        
        assert result.status == "filled"
        assert len(result.trades) == 1
    
    def test_ioc_partial_fill_cancel_remainder(self, engine):
        """Test IOC order partial fill with remainder cancelled."""
        # Add partial liquidity
        sell = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 0.5, 50000)
        engine.process_order(sell)
        
        # Submit IOC buy
        buy = create_order("BUY-1", OrderType.IOC, Side.BUY, 1.0, 50000)
        result = engine.process_order(buy)
        
        assert len(result.trades) == 1
        assert result.trades[0].quantity == Decimal("0.5")
        assert result.remaining_quantity == Decimal("0.5")
        
        # Verify order is NOT on book
        order_book = engine.order_books["BTC-USDT"]
        assert not order_book.has_order("BUY-1")
    
    def test_ioc_no_match_cancelled(self, engine):
        """Test IOC order with no match is cancelled."""
        # Submit IOC buy with no liquidity
        buy = create_order("BUY-1", OrderType.IOC, Side.BUY, 1.0, 50000)
        result = engine.process_order(buy)
        
        assert len(result.trades) == 0
        assert result.remaining_quantity == Decimal("1.0")


class TestFOKOrders:
    """Tests for FOK (Fill-Or-Kill) orders."""
    
    def test_fok_full_fill(self, engine):
        """Test FOK order with sufficient liquidity."""
        # Add enough liquidity
        sell1 = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 0.5, 50000)
        sell2 = create_order("SELL-2", OrderType.LIMIT, Side.SELL, 0.5, 50010)
        
        engine.process_order(sell1)
        engine.process_order(sell2)
        
        # Submit FOK buy
        buy = create_order("BUY-1", OrderType.FOK, Side.BUY, 1.0, 50010)
        result = engine.process_order(buy)
        
        assert result.status == "filled"
        assert len(result.trades) == 2
        assert buy.remaining_quantity == Decimal("0")
    
    def test_fok_insufficient_liquidity_cancelled(self, engine):
        """Test FOK order cancelled due to insufficient liquidity."""
        # Add partial liquidity
        sell = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 0.5, 50000)
        engine.process_order(sell)
        
        # Submit FOK buy for more than available
        buy = create_order("BUY-1", OrderType.FOK, Side.BUY, 1.0, 50000)
        result = engine.process_order(buy)
        
        assert result.status == "cancelled"
        assert len(result.trades) == 0
        assert result.remaining_quantity == Decimal("1.0")
        
        # Verify sell order still on book (not partially filled)
        order_book = engine.order_books["BTC-USDT"]
        sell_order = order_book.get_order("SELL-1")
        assert sell_order.remaining_quantity == Decimal("0.5")


class TestPriceTimePriority:
    """Tests for price-time priority enforcement."""
    
    def test_price_priority(self, engine):
        """Test that better prices are matched first."""
        # Add sell orders at different prices
        sell1 = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 1.0, 50010)
        sell2 = create_order("SELL-2", OrderType.LIMIT, Side.SELL, 1.0, 50000)
        sell3 = create_order("SELL-3", OrderType.LIMIT, Side.SELL, 1.0, 50020)
        
        engine.process_order(sell1)
        engine.process_order(sell2)
        engine.process_order(sell3)
        
        # Submit market buy
        buy = create_order("BUY-1", OrderType.MARKET, Side.BUY, 2.5)
        result = engine.process_order(buy)
        
        # Check execution order (best price first)
        assert result.trades[0].price == Decimal("50000")
        assert result.trades[1].price == Decimal("50010")
        assert result.trades[2].price == Decimal("50020")
    
    def test_time_priority_same_price(self, engine):
        """Test FIFO matching at same price level."""
        # Add sell orders at same price
        sell1 = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 1.0, 50000)
        sell2 = create_order("SELL-2", OrderType.LIMIT, Side.SELL, 1.0, 50000)
        sell3 = create_order("SELL-3", OrderType.LIMIT, Side.SELL, 1.0, 50000)
        
        engine.process_order(sell1)
        engine.process_order(sell2)
        engine.process_order(sell3)
        
        # Submit market buy
        buy = create_order("BUY-1", OrderType.MARKET, Side.BUY, 2.5)
        result = engine.process_order(buy)
        
        # Check FIFO order
        assert result.trades[0].maker_order_id == "SELL-1"
        assert result.trades[1].maker_order_id == "SELL-2"
        assert result.trades[2].maker_order_id == "SELL-3"
    
    def test_trade_through_prevention(self, engine):
        """Test that trade-throughs are prevented."""
        # Add sell orders
        sell1 = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 1.0, 50000)
        sell2 = create_order("SELL-2", OrderType.LIMIT, Side.SELL, 1.0, 50100)
        
        engine.process_order(sell1)
        engine.process_order(sell2)
        
        # Submit limit buy that should only match at 50000
        buy = create_order("BUY-1", OrderType.LIMIT, Side.BUY, 2.0, 50050)
        result = engine.process_order(buy)
        
        # Should only match first order at 50000
        assert len(result.trades) == 1
        assert result.trades[0].price == Decimal("50000")
        assert result.remaining_quantity == Decimal("1.0")


class TestOrderCancellation:
    """Tests for order cancellation."""
    
    def test_cancel_resting_order(self, engine):
        """Test cancelling a resting order."""
        # Add order to book
        buy = create_order("BUY-1", OrderType.LIMIT, Side.BUY, 1.0, 49000)
        engine.process_order(buy)
        
        # Cancel order
        success = engine.cancel_order("BUY-1", "BTC-USDT")
        
        assert success
        order_book = engine.order_books["BTC-USDT"]
        assert not order_book.has_order("BUY-1")
    
    def test_cancel_nonexistent_order(self, engine):
        """Test cancelling order that doesn't exist."""
        success = engine.cancel_order("NONEXISTENT", "BTC-USDT")
        assert not success


class TestTradeGeneration:
    """Tests for trade execution records."""
    
    def test_trade_fields(self, engine):
        """Test that trades have all required fields."""
        # Add sell order
        sell = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 1.0, 50000)
        engine.process_order(sell)
        
        # Submit buy order
        buy = create_order("BUY-1", OrderType.LIMIT, Side.BUY, 1.0, 50000)
        result = engine.process_order(buy)
        
        trade = result.trades[0]
        assert trade.trade_id is not None
        assert trade.symbol == "BTC-USDT"
        assert trade.price == Decimal("50000")
        assert trade.quantity == Decimal("1.0")
        assert trade.maker_order_id == "SELL-1"
        assert trade.taker_order_id == "BUY-1"
        assert trade.aggressor_side == Side.BUY
        assert trade.timestamp is not None
    
    def test_multiple_trades_from_single_order(self, engine):
        """Test that single order can generate multiple trades."""
        # Add multiple sell orders
        sell1 = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 0.5, 50000)
        sell2 = create_order("SELL-2", OrderType.LIMIT, Side.SELL, 0.5, 50000)
        
        engine.process_order(sell1)
        engine.process_order(sell2)
        
        # Submit buy order
        buy = create_order("BUY-1", OrderType.MARKET, Side.BUY, 1.0)
        result = engine.process_order(buy)
        
        assert len(result.trades) == 2
        assert result.trades[0].maker_order_id == "SELL-1"
        assert result.trades[1].maker_order_id == "SELL-2"
