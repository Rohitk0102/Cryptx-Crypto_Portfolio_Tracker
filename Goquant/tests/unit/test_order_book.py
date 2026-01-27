"""Unit tests for order book functionality."""

import pytest
from decimal import Decimal
from datetime import datetime

from matching_engine.core.order_book import OrderBook, PriceLevel
from matching_engine.core.models import Order, OrderType, Side, OrderStatus
from matching_engine.core.exceptions import OrderNotFoundError


@pytest.fixture
def order_book():
    """Create an order book for testing."""
    return OrderBook("BTC-USDT")


@pytest.fixture
def buy_order():
    """Create a sample buy order."""
    return Order(
        order_id="ORD-001",
        symbol="BTC-USDT",
        order_type=OrderType.LIMIT,
        side=Side.BUY,
        quantity=Decimal("1.0"),
        price=Decimal("50000.00"),
        timestamp=datetime.utcnow(),
        remaining_quantity=Decimal("1.0")
    )


@pytest.fixture
def sell_order():
    """Create a sample sell order."""
    return Order(
        order_id="ORD-002",
        symbol="BTC-USDT",
        order_type=OrderType.LIMIT,
        side=Side.SELL,
        quantity=Decimal("1.0"),
        price=Decimal("50100.00"),
        timestamp=datetime.utcnow(),
        remaining_quantity=Decimal("1.0")
    )


class TestPriceLevel:
    """Tests for PriceLevel class."""
    
    def test_price_level_creation(self):
        """Test price level initialization."""
        price = Decimal("50000.00")
        level = PriceLevel(price)
        
        assert level.price == price
        assert len(level.orders) == 0
        assert level.total_quantity == Decimal("0")
        assert level.is_empty()
    
    def test_add_order_to_level(self, buy_order):
        """Test adding order to price level."""
        level = PriceLevel(Decimal("50000.00"))
        level.add_order(buy_order)
        
        assert len(level.orders) == 1
        assert level.total_quantity == buy_order.quantity
        assert not level.is_empty()
    
    def test_remove_order_from_level(self, buy_order):
        """Test removing order from price level."""
        level = PriceLevel(Decimal("50000.00"))
        level.add_order(buy_order)
        level.remove_order(buy_order)
        
        assert len(level.orders) == 0
        assert level.total_quantity == Decimal("0")
        assert level.is_empty()


class TestOrderBook:
    """Tests for OrderBook class."""
    
    def test_order_book_creation(self, order_book):
        """Test order book initialization."""
        assert order_book.symbol == "BTC-USDT"
        assert len(order_book.bids) == 0
        assert len(order_book.asks) == 0
        assert len(order_book.order_index) == 0
    
    def test_add_buy_order(self, order_book, buy_order):
        """Test adding buy order to order book."""
        order_book.add_order(buy_order)
        
        assert len(order_book.bids) == 1
        assert buy_order.price in order_book.bids
        assert order_book.has_order(buy_order.order_id)
    
    def test_add_sell_order(self, order_book, sell_order):
        """Test adding sell order to order book."""
        order_book.add_order(sell_order)
        
        assert len(order_book.asks) == 1
        assert sell_order.price in order_book.asks
        assert order_book.has_order(sell_order.order_id)
    
    def test_add_multiple_orders_same_price(self, order_book):
        """Test adding multiple orders at same price level."""
        orders = [
            Order(
                order_id=f"ORD-{i}",
                symbol="BTC-USDT",
                order_type=OrderType.LIMIT,
                side=Side.BUY,
                quantity=Decimal("1.0"),
                price=Decimal("50000.00"),
                timestamp=datetime.utcnow(),
                remaining_quantity=Decimal("1.0")
            )
            for i in range(3)
        ]
        
        for order in orders:
            order_book.add_order(order)
        
        assert len(order_book.bids) == 1
        price_level = order_book.bids[Decimal("50000.00")]
        assert len(price_level.orders) == 3
        assert price_level.total_quantity == Decimal("3.0")
    
    def test_remove_order(self, order_book, buy_order):
        """Test removing order from order book."""
        order_book.add_order(buy_order)
        removed = order_book.remove_order(buy_order.order_id)
        
        assert removed == buy_order
        assert len(order_book.bids) == 0
        assert not order_book.has_order(buy_order.order_id)
    
    def test_remove_nonexistent_order(self, order_book):
        """Test removing order that doesn't exist."""
        with pytest.raises(OrderNotFoundError):
            order_book.remove_order("NONEXISTENT")
    
    def test_get_best_bid_empty(self, order_book):
        """Test getting best bid from empty book."""
        assert order_book.get_best_bid() is None
    
    def test_get_best_ask_empty(self, order_book):
        """Test getting best ask from empty book."""
        assert order_book.get_best_ask() is None
    
    def test_get_best_bid(self, order_book):
        """Test getting best (highest) bid."""
        orders = [
            Order(
                order_id=f"ORD-{i}",
                symbol="BTC-USDT",
                order_type=OrderType.LIMIT,
                side=Side.BUY,
                quantity=Decimal("1.0"),
                price=Decimal(str(50000 - i * 10)),
                timestamp=datetime.utcnow(),
                remaining_quantity=Decimal("1.0")
            )
            for i in range(3)
        ]
        
        for order in orders:
            order_book.add_order(order)
        
        best_bid_price, best_bid_level = order_book.get_best_bid()
        assert best_bid_price == Decimal("50000.00")  # Highest bid
    
    def test_get_best_ask(self, order_book):
        """Test getting best (lowest) ask."""
        orders = [
            Order(
                order_id=f"ORD-{i}",
                symbol="BTC-USDT",
                order_type=OrderType.LIMIT,
                side=Side.SELL,
                quantity=Decimal("1.0"),
                price=Decimal(str(50100 + i * 10)),
                timestamp=datetime.utcnow(),
                remaining_quantity=Decimal("1.0")
            )
            for i in range(3)
        ]
        
        for order in orders:
            order_book.add_order(order)
        
        best_ask_price, best_ask_level = order_book.get_best_ask()
        assert best_ask_price == Decimal("50100.00")  # Lowest ask
    
    def test_price_time_priority(self, order_book):
        """Test that orders at same price maintain FIFO order."""
        orders = [
            Order(
                order_id=f"ORD-{i}",
                symbol="BTC-USDT",
                order_type=OrderType.LIMIT,
                side=Side.BUY,
                quantity=Decimal("1.0"),
                price=Decimal("50000.00"),
                timestamp=datetime.utcnow(),
                remaining_quantity=Decimal("1.0")
            )
            for i in range(3)
        ]
        
        for order in orders:
            order_book.add_order(order)
        
        price_level = order_book.bids[Decimal("50000.00")]
        
        # Check FIFO order
        for i, order in enumerate(price_level.orders):
            assert order.order_id == f"ORD-{i}"
    
    def test_calculate_bbo(self, order_book, buy_order, sell_order):
        """Test BBO calculation."""
        order_book.add_order(buy_order)
        order_book.add_order(sell_order)
        
        bbo = order_book.calculate_bbo()
        
        assert bbo.symbol == "BTC-USDT"
        assert bbo.best_bid == buy_order.price
        assert bbo.best_bid_quantity == buy_order.quantity
        assert bbo.best_ask == sell_order.price
        assert bbo.best_ask_quantity == sell_order.quantity
    
    def test_calculate_bbo_empty_book(self, order_book):
        """Test BBO calculation with empty book."""
        bbo = order_book.calculate_bbo()
        
        assert bbo.best_bid is None
        assert bbo.best_ask is None
        assert bbo.best_bid_quantity == Decimal("0")
        assert bbo.best_ask_quantity == Decimal("0")
    
    def test_get_depth(self, order_book):
        """Test getting order book depth."""
        # Add multiple bid levels
        for i in range(5):
            order = Order(
                order_id=f"BID-{i}",
                symbol="BTC-USDT",
                order_type=OrderType.LIMIT,
                side=Side.BUY,
                quantity=Decimal("1.0"),
                price=Decimal(str(50000 - i * 10)),
                timestamp=datetime.utcnow(),
                remaining_quantity=Decimal("1.0")
            )
            order_book.add_order(order)
        
        # Add multiple ask levels
        for i in range(5):
            order = Order(
                order_id=f"ASK-{i}",
                symbol="BTC-USDT",
                order_type=OrderType.LIMIT,
                side=Side.SELL,
                quantity=Decimal("1.0"),
                price=Decimal(str(50100 + i * 10)),
                timestamp=datetime.utcnow(),
                remaining_quantity=Decimal("1.0")
            )
            order_book.add_order(order)
        
        bids, asks = order_book.get_depth(levels=3)
        
        assert len(bids) == 3
        assert len(asks) == 3
        
        # Check bid ordering (highest to lowest)
        assert bids[0][0] == "50000"
        assert bids[1][0] == "49990"
        assert bids[2][0] == "49980"
        
        # Check ask ordering (lowest to highest)
        assert asks[0][0] == "50100"
        assert asks[1][0] == "50110"
        assert asks[2][0] == "50120"
    
    def test_remove_empty_price_level(self, order_book, buy_order):
        """Test that empty price levels are removed."""
        order_book.add_order(buy_order)
        assert buy_order.price in order_book.bids
        
        order_book.remove_order(buy_order.order_id)
        assert buy_order.price not in order_book.bids
