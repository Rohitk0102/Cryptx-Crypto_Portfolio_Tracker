"""
Comprehensive tests for REG NMS-inspired core requirements.

Tests verify:
1. BBO Calculation and Dissemination
2. Internal Order Protection & Price-Time Priority
3. Order Type Handling (Market, Limit, IOC, FOK)
"""

import pytest
from decimal import Decimal
from datetime import datetime

from matching_engine.core.engine import MatchingEngine
from matching_engine.core.models import Order, OrderType, Side, OrderStatus


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


class TestBBOCalculationAndDissemination:
    """
    Requirement 1: BBO Calculation and Dissemination
    - Maintain real-time BBO for each trading pair
    - Accurately calculate and update BBO instantaneously
    """
    
    def test_bbo_empty_book(self):
        """Test BBO calculation with empty order book."""
        engine = MatchingEngine()
        order_book = engine.get_or_create_order_book("BTC-USDT")
        
        bbo = order_book.calculate_bbo()
        
        assert bbo.symbol == "BTC-USDT"
        assert bbo.best_bid is None
        assert bbo.best_ask is None
        assert bbo.best_bid_quantity == Decimal("0")
        assert bbo.best_ask_quantity == Decimal("0")
        print("✓ BBO correctly handles empty book")
    
    def test_bbo_updates_on_order_add(self):
        """Test BBO updates when orders are added."""
        engine = MatchingEngine()
        order_book = engine.get_or_create_order_book("BTC-USDT")
        
        # Add buy order
        buy = create_order("BUY-1", OrderType.LIMIT, Side.BUY, 1.0, 50000)
        engine.process_order(buy)
        
        bbo = order_book.calculate_bbo()
        assert bbo.best_bid == Decimal("50000")
        assert bbo.best_bid_quantity == Decimal("1.0")
        assert bbo.best_ask is None
        
        # Add sell order
        sell = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 2.0, 50100)
        engine.process_order(sell)
        
        bbo = order_book.calculate_bbo()
        assert bbo.best_bid == Decimal("50000")
        assert bbo.best_bid_quantity == Decimal("1.0")
        assert bbo.best_ask == Decimal("50100")
        assert bbo.best_ask_quantity == Decimal("2.0")
        print("✓ BBO updates correctly when orders are added")
    
    def test_bbo_updates_on_order_match(self):
        """Test BBO updates when orders are matched."""
        engine = MatchingEngine()
        
        # Add sell order
        sell = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 1.0, 50000)
        engine.process_order(sell)
        
        order_book = engine.order_books["BTC-USDT"]
        bbo_before = order_book.calculate_bbo()
        assert bbo_before.best_ask == Decimal("50000")
        
        # Match with buy order
        buy = create_order("BUY-1", OrderType.MARKET, Side.BUY, 1.0)
        engine.process_order(buy)
        
        bbo_after = order_book.calculate_bbo()
        assert bbo_after.best_ask is None  # Ask removed after match
        print("✓ BBO updates correctly when orders are matched")
    
    def test_bbo_updates_on_order_cancel(self):
        """Test BBO updates when orders are cancelled."""
        engine = MatchingEngine()
        
        # Add orders
        buy1 = create_order("BUY-1", OrderType.LIMIT, Side.BUY, 1.0, 50000)
        buy2 = create_order("BUY-2", OrderType.LIMIT, Side.BUY, 1.0, 49900)
        engine.process_order(buy1)
        engine.process_order(buy2)
        
        order_book = engine.order_books["BTC-USDT"]
        bbo_before = order_book.calculate_bbo()
        assert bbo_before.best_bid == Decimal("50000")
        
        # Cancel best bid
        engine.cancel_order("BUY-1", "BTC-USDT")
        
        bbo_after = order_book.calculate_bbo()
        assert bbo_after.best_bid == Decimal("49900")  # Next best bid
        print("✓ BBO updates correctly when orders are cancelled")
    
    def test_bbo_multiple_orders_same_price(self):
        """Test BBO aggregates quantity at same price level."""
        engine = MatchingEngine()
        
        # Add multiple orders at same price
        for i in range(3):
            buy = create_order(f"BUY-{i}", OrderType.LIMIT, Side.BUY, 1.0, 50000)
            engine.process_order(buy)
        
        order_book = engine.order_books["BTC-USDT"]
        bbo = order_book.calculate_bbo()
        
        assert bbo.best_bid == Decimal("50000")
        assert bbo.best_bid_quantity == Decimal("3.0")  # Aggregated
        print("✓ BBO correctly aggregates quantity at same price level")


class TestPriceTimePriority:
    """
    Requirement 2: Internal Order Protection & Price-Time Priority
    - Strict price-time priority (FIFO at each price level)
    - Better prices always prioritized
    - Prevent internal trade-throughs
    """
    
    def test_price_priority_buy_side(self):
        """Test that higher bid prices are matched first."""
        engine = MatchingEngine()
        
        # Add sell orders at different prices
        sell1 = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 1.0, 50100)
        sell2 = create_order("SELL-2", OrderType.LIMIT, Side.SELL, 1.0, 50000)  # Better price
        sell3 = create_order("SELL-3", OrderType.LIMIT, Side.SELL, 1.0, 50200)
        
        engine.process_order(sell1)
        engine.process_order(sell2)
        engine.process_order(sell3)
        
        # Market buy should match best prices first
        buy = create_order("BUY-1", OrderType.MARKET, Side.BUY, 3.0)
        result = engine.process_order(buy)
        
        # Verify execution order: 50000, 50100, 50200
        assert len(result.trades) == 3
        assert result.trades[0].price == Decimal("50000")
        assert result.trades[1].price == Decimal("50100")
        assert result.trades[2].price == Decimal("50200")
        print("✓ Price priority enforced: better prices matched first")
    
    def test_price_priority_sell_side(self):
        """Test that higher bid prices are matched first on sell side."""
        engine = MatchingEngine()
        
        # Add buy orders at different prices
        buy1 = create_order("BUY-1", OrderType.LIMIT, Side.BUY, 1.0, 49900)
        buy2 = create_order("BUY-2", OrderType.LIMIT, Side.BUY, 1.0, 50000)  # Better price
        buy3 = create_order("BUY-3", OrderType.LIMIT, Side.BUY, 1.0, 49800)
        
        engine.process_order(buy1)
        engine.process_order(buy2)
        engine.process_order(buy3)
        
        # Market sell should match best prices first
        sell = create_order("SELL-1", OrderType.MARKET, Side.SELL, 3.0)
        result = engine.process_order(sell)
        
        # Verify execution order: 50000, 49900, 49800
        assert len(result.trades) == 3
        assert result.trades[0].price == Decimal("50000")
        assert result.trades[1].price == Decimal("49900")
        assert result.trades[2].price == Decimal("49800")
        print("✓ Price priority enforced on sell side")
    
    def test_time_priority_fifo(self):
        """Test FIFO matching at same price level."""
        engine = MatchingEngine()
        
        # Add orders at same price in sequence
        for i in range(5):
            sell = create_order(f"SELL-{i}", OrderType.LIMIT, Side.SELL, 1.0, 50000)
            engine.process_order(sell)
        
        # Match with buy order
        buy = create_order("BUY-1", OrderType.MARKET, Side.BUY, 3.0)
        result = engine.process_order(buy)
        
        # Verify FIFO order
        assert len(result.trades) == 3
        assert result.trades[0].maker_order_id == "SELL-0"
        assert result.trades[1].maker_order_id == "SELL-1"
        assert result.trades[2].maker_order_id == "SELL-2"
        print("✓ Time priority (FIFO) enforced at same price level")
    
    def test_no_trade_through_limit_order(self):
        """Test that limit orders don't trade through better prices."""
        engine = MatchingEngine()
        
        # Add sell orders at different prices
        sell1 = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 1.0, 50000)
        sell2 = create_order("SELL-2", OrderType.LIMIT, Side.SELL, 1.0, 50200)
        
        engine.process_order(sell1)
        engine.process_order(sell2)
        
        # Limit buy at 50100 should only match at 50000, not 50200
        buy = create_order("BUY-1", OrderType.LIMIT, Side.BUY, 2.0, 50100)
        result = engine.process_order(buy)
        
        # Should only match first order
        assert len(result.trades) == 1
        assert result.trades[0].price == Decimal("50000")
        assert result.remaining_quantity == Decimal("1.0")
        print("✓ Trade-through prevention: limit order stops at price limit")
    
    def test_partial_fill_at_better_price(self):
        """Test partial fill at better price before moving to next level."""
        engine = MatchingEngine()
        
        # Add sell orders
        sell1 = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 0.5, 50000)
        sell2 = create_order("SELL-2", OrderType.LIMIT, Side.SELL, 1.0, 50100)
        
        engine.process_order(sell1)
        engine.process_order(sell2)
        
        # Market buy for 1.5
        buy = create_order("BUY-1", OrderType.MARKET, Side.BUY, 1.5)
        result = engine.process_order(buy)
        
        # Should fill 0.5 at 50000, then 1.0 at 50100
        assert len(result.trades) == 2
        assert result.trades[0].price == Decimal("50000")
        assert result.trades[0].quantity == Decimal("0.5")
        assert result.trades[1].price == Decimal("50100")
        assert result.trades[1].quantity == Decimal("1.0")
        print("✓ Partial fill at better price before moving to next level")
    
    def test_no_trade_through_across_spread(self):
        """Test that orders don't trade through the spread."""
        engine = MatchingEngine()
        
        # Create spread: bid at 49900, ask at 50100
        buy = create_order("BUY-1", OrderType.LIMIT, Side.BUY, 1.0, 49900)
        sell = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 1.0, 50100)
        
        engine.process_order(buy)
        engine.process_order(sell)
        
        # New buy at 50000 should not match with sell at 50100
        buy2 = create_order("BUY-2", OrderType.LIMIT, Side.BUY, 1.0, 50000)
        result = engine.process_order(buy2)
        
        assert len(result.trades) == 0
        assert result.status == "accepted"
        print("✓ Orders don't trade through the spread")


class TestMarketOrders:
    """
    Requirement 3.1: Market Order Handling
    - Executes immediately at best available price(s)
    """
    
    def test_market_order_full_execution(self):
        """Test market order executes at best available prices."""
        engine = MatchingEngine()
        
        # Add liquidity
        sell1 = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 1.0, 50000)
        sell2 = create_order("SELL-2", OrderType.LIMIT, Side.SELL, 1.0, 50010)
        
        engine.process_order(sell1)
        engine.process_order(sell2)
        
        # Market buy
        buy = create_order("BUY-1", OrderType.MARKET, Side.BUY, 2.0)
        result = engine.process_order(buy)
        
        assert result.status == "filled"
        assert len(result.trades) == 2
        assert result.trades[0].price == Decimal("50000")
        assert result.trades[1].price == Decimal("50010")
        print("✓ Market order executes at best available prices")
    
    def test_market_order_partial_liquidity(self):
        """Test market order with insufficient liquidity."""
        engine = MatchingEngine()
        
        # Limited liquidity
        sell = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 1.0, 50000)
        engine.process_order(sell)
        
        # Market buy for more than available
        buy = create_order("BUY-1", OrderType.MARKET, Side.BUY, 2.0)
        result = engine.process_order(buy)
        
        assert len(result.trades) == 1
        assert result.trades[0].quantity == Decimal("1.0")
        assert result.remaining_quantity == Decimal("1.0")
        print("✓ Market order handles partial liquidity correctly")
    
    def test_market_order_no_liquidity(self):
        """Test market order with no liquidity."""
        engine = MatchingEngine()
        
        # No liquidity
        buy = create_order("BUY-1", OrderType.MARKET, Side.BUY, 1.0)
        result = engine.process_order(buy)
        
        assert len(result.trades) == 0
        assert result.remaining_quantity == Decimal("1.0")
        print("✓ Market order handles no liquidity correctly")


class TestLimitOrders:
    """
    Requirement 3.2: Limit Order Handling
    - Executes at specified price or better
    - Rests on book if not immediately marketable
    """
    
    def test_limit_order_immediate_execution(self):
        """Test limit order executes at specified price or better."""
        engine = MatchingEngine()
        
        # Add sell at 50000
        sell = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 1.0, 50000)
        engine.process_order(sell)
        
        # Limit buy at 50100 should execute at 50000 (better price)
        buy = create_order("BUY-1", OrderType.LIMIT, Side.BUY, 1.0, 50100)
        result = engine.process_order(buy)
        
        assert result.status == "filled"
        assert result.trades[0].price == Decimal("50000")  # Better than limit
        print("✓ Limit order executes at better price when available")
    
    def test_limit_order_rests_on_book(self):
        """Test limit order rests on book when not marketable."""
        engine = MatchingEngine()
        
        # Limit buy below market
        buy = create_order("BUY-1", OrderType.LIMIT, Side.BUY, 1.0, 49000)
        result = engine.process_order(buy)
        
        assert result.status == "accepted"
        assert len(result.trades) == 0
        
        # Verify on book
        order_book = engine.order_books["BTC-USDT"]
        assert order_book.has_order("BUY-1")
        print("✓ Limit order rests on book when not marketable")
    
    def test_limit_order_partial_fill_rest(self):
        """Test limit order partial fill with remainder resting."""
        engine = MatchingEngine()
        
        # Partial liquidity
        sell = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 0.5, 50000)
        engine.process_order(sell)
        
        # Limit buy for more
        buy = create_order("BUY-1", OrderType.LIMIT, Side.BUY, 1.0, 50000)
        result = engine.process_order(buy)
        
        assert result.status == "partial"
        assert len(result.trades) == 1
        assert result.trades[0].quantity == Decimal("0.5")
        
        # Verify remainder on book
        order_book = engine.order_books["BTC-USDT"]
        order = order_book.get_order("BUY-1")
        assert order.remaining_quantity == Decimal("0.5")
        print("✓ Limit order partial fill with remainder resting")
    
    def test_limit_order_price_protection(self):
        """Test limit order doesn't execute worse than limit price."""
        engine = MatchingEngine()
        
        # Add sell at 50200
        sell = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 1.0, 50200)
        engine.process_order(sell)
        
        # Limit buy at 50100 should NOT match
        buy = create_order("BUY-1", OrderType.LIMIT, Side.BUY, 1.0, 50100)
        result = engine.process_order(buy)
        
        assert len(result.trades) == 0
        assert result.status == "accepted"
        print("✓ Limit order price protection enforced")


class TestIOCOrders:
    """
    Requirement 3.3: IOC Order Handling
    - Executes immediately at best available price(s)
    - Cancels unfilled portion
    - Must not trade through BBO
    """
    
    def test_ioc_full_execution(self):
        """Test IOC order full execution."""
        engine = MatchingEngine()
        
        # Add liquidity
        sell = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 1.0, 50000)
        engine.process_order(sell)
        
        # IOC buy
        buy = create_order("BUY-1", OrderType.IOC, Side.BUY, 1.0, 50000)
        result = engine.process_order(buy)
        
        assert result.status == "filled"
        assert len(result.trades) == 1
        print("✓ IOC order full execution")
    
    def test_ioc_partial_fill_cancel_remainder(self):
        """Test IOC order partial fill with remainder cancelled."""
        engine = MatchingEngine()
        
        # Partial liquidity
        sell = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 0.5, 50000)
        engine.process_order(sell)
        
        # IOC buy for more
        buy = create_order("BUY-1", OrderType.IOC, Side.BUY, 1.0, 50000)
        result = engine.process_order(buy)
        
        assert len(result.trades) == 1
        assert result.trades[0].quantity == Decimal("0.5")
        assert result.remaining_quantity == Decimal("0.5")
        
        # Verify NOT on book
        order_book = engine.order_books["BTC-USDT"]
        assert not order_book.has_order("BUY-1")
        print("✓ IOC order partial fill with remainder cancelled")
    
    def test_ioc_no_match_cancelled(self):
        """Test IOC order cancelled when no match."""
        engine = MatchingEngine()
        
        # No liquidity
        buy = create_order("BUY-1", OrderType.IOC, Side.BUY, 1.0, 50000)
        result = engine.process_order(buy)
        
        assert len(result.trades) == 0
        assert result.remaining_quantity == Decimal("1.0")
        print("✓ IOC order cancelled when no match")
    
    def test_ioc_no_trade_through(self):
        """Test IOC order doesn't trade through BBO."""
        engine = MatchingEngine()
        
        # Add sell at 50200
        sell = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 1.0, 50200)
        engine.process_order(sell)
        
        # IOC buy at 50100 should NOT match at 50200
        buy = create_order("BUY-1", OrderType.IOC, Side.BUY, 1.0, 50100)
        result = engine.process_order(buy)
        
        assert len(result.trades) == 0
        print("✓ IOC order doesn't trade through BBO")


class TestFOKOrders:
    """
    Requirement 3.4: FOK Order Handling
    - Executes entire order immediately or cancels
    - Must not trade through BBO
    """
    
    def test_fok_full_execution(self):
        """Test FOK order full execution when sufficient liquidity."""
        engine = MatchingEngine()
        
        # Add sufficient liquidity
        sell1 = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 0.5, 50000)
        sell2 = create_order("SELL-2", OrderType.LIMIT, Side.SELL, 0.5, 50010)
        
        engine.process_order(sell1)
        engine.process_order(sell2)
        
        # FOK buy
        buy = create_order("BUY-1", OrderType.FOK, Side.BUY, 1.0, 50010)
        result = engine.process_order(buy)
        
        assert result.status == "filled"
        assert len(result.trades) == 2
        assert buy.remaining_quantity == Decimal("0")
        print("✓ FOK order full execution with sufficient liquidity")
    
    def test_fok_cancelled_insufficient_liquidity(self):
        """Test FOK order cancelled when insufficient liquidity."""
        engine = MatchingEngine()
        
        # Insufficient liquidity
        sell = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 0.5, 50000)
        engine.process_order(sell)
        
        # FOK buy for more
        buy = create_order("BUY-1", OrderType.FOK, Side.BUY, 1.0, 50000)
        result = engine.process_order(buy)
        
        assert result.status == "cancelled"
        assert len(result.trades) == 0
        assert result.remaining_quantity == Decimal("1.0")
        
        # Verify sell order still on book (not partially filled)
        order_book = engine.order_books["BTC-USDT"]
        sell_order = order_book.get_order("SELL-1")
        assert sell_order.remaining_quantity == Decimal("0.5")
        print("✓ FOK order cancelled with insufficient liquidity (atomic)")
    
    def test_fok_no_trade_through(self):
        """Test FOK order doesn't trade through BBO."""
        engine = MatchingEngine()
        
        # Add liquidity at worse price
        sell = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 1.0, 50200)
        engine.process_order(sell)
        
        # FOK buy at 50100 should be cancelled (not match at 50200)
        buy = create_order("BUY-1", OrderType.FOK, Side.BUY, 1.0, 50100)
        result = engine.process_order(buy)
        
        assert result.status == "cancelled"
        assert len(result.trades) == 0
        print("✓ FOK order doesn't trade through BBO")
    
    def test_fok_atomic_execution(self):
        """Test FOK order is truly atomic (all or nothing)."""
        engine = MatchingEngine()
        
        # Add liquidity across multiple price levels
        sell1 = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 0.3, 50000)
        sell2 = create_order("SELL-2", OrderType.LIMIT, Side.SELL, 0.3, 50010)
        sell3 = create_order("SELL-3", OrderType.LIMIT, Side.SELL, 0.3, 50020)
        
        engine.process_order(sell1)
        engine.process_order(sell2)
        engine.process_order(sell3)
        
        # FOK for 0.95 (more than available at acceptable prices)
        buy = create_order("BUY-1", OrderType.FOK, Side.BUY, 0.95, 50015)
        result = engine.process_order(buy)
        
        # Should be cancelled (can only fill 0.6 at acceptable prices)
        assert result.status == "cancelled"
        assert len(result.trades) == 0
        
        # Verify all sell orders still intact
        order_book = engine.order_books["BTC-USDT"]
        assert order_book.get_order("SELL-1").remaining_quantity == Decimal("0.3")
        assert order_book.get_order("SELL-2").remaining_quantity == Decimal("0.3")
        assert order_book.get_order("SELL-3").remaining_quantity == Decimal("0.3")
        print("✓ FOK order is truly atomic (all-or-nothing)")


def run_all_compliance_tests():
    """Run all REG NMS compliance tests."""
    print("\n" + "="*70)
    print("REG NMS COMPLIANCE TEST SUITE")
    print("="*70)
    
    test_classes = [
        TestBBOCalculationAndDissemination,
        TestPriceTimePriority,
        TestMarketOrders,
        TestLimitOrders,
        TestIOCOrders,
        TestFOKOrders
    ]
    
    total_tests = 0
    passed_tests = 0
    
    for test_class in test_classes:
        print(f"\n{test_class.__doc__}")
        print("-" * 70)
        
        instance = test_class()
        test_methods = [m for m in dir(instance) if m.startswith('test_')]
        
        for method_name in test_methods:
            total_tests += 1
            try:
                method = getattr(instance, method_name)
                method()
                passed_tests += 1
            except Exception as e:
                print(f"✗ {method_name} FAILED: {e}")
    
    print("\n" + "="*70)
    print(f"RESULTS: {passed_tests}/{total_tests} tests passed")
    print("="*70)
    
    return passed_tests == total_tests


if __name__ == "__main__":
    success = run_all_compliance_tests()
    exit(0 if success else 1)
