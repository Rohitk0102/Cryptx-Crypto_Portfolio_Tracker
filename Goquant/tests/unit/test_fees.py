"""Tests for maker-taker fee model."""

import pytest
from decimal import Decimal
from datetime import datetime

from matching_engine.core.engine import MatchingEngine
from matching_engine.core.models import Order, OrderType, Side
from matching_engine.utils.fees import FeeCalculator


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


class TestFeeCalculator:
    """Tests for FeeCalculator class."""
    
    def test_default_fee_rates(self):
        """Test default fee rates."""
        calc = FeeCalculator()
        
        assert calc.maker_fee_rate == Decimal("0.001")  # 0.1%
        assert calc.taker_fee_rate == Decimal("0.002")  # 0.2%
        
        print("✓ Default fee rates correct")
    
    def test_custom_fee_rates(self):
        """Test custom fee rates."""
        calc = FeeCalculator(
            maker_fee_rate=Decimal("0.0005"),
            taker_fee_rate=Decimal("0.0015")
        )
        
        assert calc.maker_fee_rate == Decimal("0.0005")
        assert calc.taker_fee_rate == Decimal("0.0015")
        
        print("✓ Custom fee rates work")
    
    def test_fee_calculation(self):
        """Test fee calculation."""
        calc = FeeCalculator()
        
        # Trade value: 1 BTC @ 50000 USDT = 50000 USDT
        trade_value = Decimal("50000")
        
        maker_fee, taker_fee = calc.calculate_fees(trade_value)
        
        # Maker: 50000 * 0.001 = 50 USDT
        # Taker: 50000 * 0.002 = 100 USDT
        assert maker_fee == Decimal("50.00000000")
        assert taker_fee == Decimal("100.00000000")
        
        print("✓ Fee calculation correct")
    
    def test_fee_precision(self):
        """Test fee precision (8 decimal places)."""
        calc = FeeCalculator()
        
        trade_value = Decimal("0.00123456")
        maker_fee, taker_fee = calc.calculate_fees(trade_value)
        
        # Check 8 decimal places
        assert len(str(maker_fee).split('.')[-1]) <= 8
        assert len(str(taker_fee).split('.')[-1]) <= 8
        
        print("✓ Fee precision correct")
    
    def test_net_proceeds(self):
        """Test net proceeds calculation."""
        calc = FeeCalculator()
        
        trade_value = Decimal("1000")
        
        # Maker net: 1000 - (1000 * 0.001) = 999
        maker_net = calc.get_net_proceeds(trade_value, is_maker=True)
        assert maker_net == Decimal("999.00000000")
        
        # Taker net: 1000 - (1000 * 0.002) = 998
        taker_net = calc.get_net_proceeds(trade_value, is_maker=False)
        assert taker_net == Decimal("998.00000000")
        
        print("✓ Net proceeds calculation correct")


class TestEngineWithFees:
    """Tests for matching engine with fees enabled."""
    
    def test_fees_disabled_by_default(self):
        """Test that fees are disabled by default."""
        engine = MatchingEngine()
        
        assert engine.enable_fees is False
        assert engine.fee_calculator is None
        
        print("✓ Fees disabled by default")
    
    def test_fees_can_be_enabled(self):
        """Test enabling fees."""
        engine = MatchingEngine(enable_fees=True)
        
        assert engine.enable_fees is True
        assert engine.fee_calculator is not None
        
        print("✓ Fees can be enabled")
    
    def test_trade_includes_fees(self):
        """Test that trades include fee information."""
        engine = MatchingEngine(enable_fees=True)
        
        # Add sell order
        sell = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 1.0, 50000)
        engine.process_order(sell)
        
        # Add buy order
        buy = create_order("BUY-1", OrderType.MARKET, Side.BUY, 1.0)
        result = engine.process_order(buy)
        
        # Check trade has fees
        assert len(result.trades) == 1
        trade = result.trades[0]
        
        assert trade.maker_fee > 0
        assert trade.taker_fee > 0
        assert trade.maker_fee_rate == Decimal("0.001")
        assert trade.taker_fee_rate == Decimal("0.002")
        
        # Trade value: 1.0 * 50000 = 50000
        # Maker fee: 50000 * 0.001 = 50
        # Taker fee: 50000 * 0.002 = 100
        assert trade.maker_fee == Decimal("50.00000000")
        assert trade.taker_fee == Decimal("100.00000000")
        
        print("✓ Trades include fee information")
    
    def test_trade_dict_includes_fees(self):
        """Test that trade serialization includes fees."""
        engine = MatchingEngine(enable_fees=True)
        
        # Execute trade
        sell = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 1.0, 50000)
        engine.process_order(sell)
        
        buy = create_order("BUY-1", OrderType.MARKET, Side.BUY, 1.0)
        result = engine.process_order(buy)
        
        trade_dict = result.trades[0].to_dict()
        
        assert "maker_fee" in trade_dict
        assert "taker_fee" in trade_dict
        assert "maker_fee_rate" in trade_dict
        assert "taker_fee_rate" in trade_dict
        
        print("✓ Trade serialization includes fees")
    
    def test_custom_fee_rates(self):
        """Test custom fee rates in engine."""
        engine = MatchingEngine(
            enable_fees=True,
            maker_fee_rate=Decimal("0.0005"),
            taker_fee_rate=Decimal("0.0015")
        )
        
        # Execute trade
        sell = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 1.0, 50000)
        engine.process_order(sell)
        
        buy = create_order("BUY-1", OrderType.MARKET, Side.BUY, 1.0)
        result = engine.process_order(buy)
        
        trade = result.trades[0]
        
        # Trade value: 50000
        # Maker fee: 50000 * 0.0005 = 25
        # Taker fee: 50000 * 0.0015 = 75
        assert trade.maker_fee == Decimal("25.00000000")
        assert trade.taker_fee == Decimal("75.00000000")
        
        print("✓ Custom fee rates work in engine")
    
    def test_multiple_trades_fees(self):
        """Test fees across multiple trades."""
        engine = MatchingEngine(enable_fees=True)
        
        # Add multiple sell orders
        for i in range(3):
            sell = create_order(f"SELL-{i}", OrderType.LIMIT, Side.SELL, 0.5, 50000)
            engine.process_order(sell)
        
        # Buy order that matches all
        buy = create_order("BUY-1", OrderType.MARKET, Side.BUY, 1.5)
        result = engine.process_order(buy)
        
        # Each trade should have fees
        assert len(result.trades) == 3
        
        for trade in result.trades:
            assert trade.maker_fee > 0
            assert trade.taker_fee > 0
            
            # Each trade: 0.5 * 50000 = 25000
            # Maker: 25000 * 0.001 = 25
            # Taker: 25000 * 0.002 = 50
            assert trade.maker_fee == Decimal("25.00000000")
            assert trade.taker_fee == Decimal("50.00000000")
        
        print("✓ Multiple trades have correct fees")


if __name__ == "__main__":
    print("\n" + "="*70)
    print("FEE MODEL TESTS")
    print("="*70)
    
    test_classes = [
        TestFeeCalculator,
        TestEngineWithFees
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
                    import traceback
                    traceback.print_exc()
    
    print("\n" + "="*70)
    print(f"RESULTS: {passed}/{total} tests passed")
    print("="*70)
