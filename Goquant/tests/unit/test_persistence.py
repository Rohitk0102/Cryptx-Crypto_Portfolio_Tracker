"""Tests for order book persistence and recovery."""

import pytest
import os
from decimal import Decimal
from datetime import datetime
from pathlib import Path

from matching_engine.core.engine import MatchingEngine
from matching_engine.core.models import Order, OrderType, Side, OrderStatus
from matching_engine.persistence.snapshot import OrderBookSnapshot


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


class TestOrderBookPersistence:
    """Tests for order book snapshot and recovery."""
    
    def test_save_and_load_order_book(self):
        """Test saving and loading order book state."""
        engine = MatchingEngine()
        snapshot_mgr = OrderBookSnapshot(snapshot_dir="test_snapshots")
        
        # Add orders to book
        buy1 = create_order("BUY-1", OrderType.LIMIT, Side.BUY, 1.0, 50000)
        buy2 = create_order("BUY-2", OrderType.LIMIT, Side.BUY, 2.0, 49900)
        sell1 = create_order("SELL-1", OrderType.LIMIT, Side.SELL, 1.5, 50100)
        
        engine.process_order(buy1)
        engine.process_order(buy2)
        engine.process_order(sell1)
        
        order_book = engine.order_books["BTC-USDT"]
        
        # Save snapshot
        filepath = snapshot_mgr.save_order_book(order_book, "test_book.json")
        assert os.path.exists(filepath)
        
        # Load snapshot
        loaded_book = snapshot_mgr.load_order_book(filepath)
        
        # Verify state
        assert loaded_book.symbol == "BTC-USDT"
        assert len(loaded_book.bids) == 2
        assert len(loaded_book.asks) == 1
        assert loaded_book.has_order("BUY-1")
        assert loaded_book.has_order("BUY-2")
        assert loaded_book.has_order("SELL-1")
        
        # Cleanup
        os.remove(filepath)
        os.rmdir("test_snapshots")
        
        print("✓ Order book save and load works correctly")
    
    def test_save_and_load_engine_state(self):
        """Test saving and loading complete engine state."""
        engine = MatchingEngine()
        snapshot_mgr = OrderBookSnapshot(snapshot_dir="test_snapshots")
        
        # Process multiple orders
        for i in range(5):
            buy = create_order(f"BUY-{i}", OrderType.LIMIT, Side.BUY, 1.0, 50000 - i * 10)
            engine.process_order(buy)
        
        for i in range(3):
            sell = create_order(f"SELL-{i}", OrderType.LIMIT, Side.SELL, 1.0, 50100 + i * 10)
            engine.process_order(sell)
        
        # Save state
        filepath = snapshot_mgr.save_engine_state(engine, "test_engine.json")
        assert os.path.exists(filepath)
        
        # Create new engine and load state
        new_engine = MatchingEngine()
        snapshot_mgr.load_engine_state(new_engine, filepath)
        
        # Verify state
        assert new_engine.order_id_counter == engine.order_id_counter
        assert new_engine.trade_id_counter == engine.trade_id_counter
        assert "BTC-USDT" in new_engine.order_books
        
        order_book = new_engine.order_books["BTC-USDT"]
        assert len(order_book.bids) == 5
        assert len(order_book.asks) == 3
        
        # Cleanup
        os.remove(filepath)
        os.rmdir("test_snapshots")
        
        print("✓ Engine state save and load works correctly")
    
    def test_persistence_preserves_order_priority(self):
        """Test that persistence preserves price-time priority."""
        engine = MatchingEngine()
        snapshot_mgr = OrderBookSnapshot(snapshot_dir="test_snapshots")
        
        # Add orders at same price in sequence
        for i in range(3):
            buy = create_order(f"BUY-{i}", OrderType.LIMIT, Side.BUY, 1.0, 50000)
            engine.process_order(buy)
        
        # Save and load
        filepath = snapshot_mgr.save_engine_state(engine, "test_priority.json")
        new_engine = MatchingEngine()
        snapshot_mgr.load_engine_state(new_engine, filepath)
        
        # Verify FIFO order preserved
        order_book = new_engine.order_books["BTC-USDT"]
        price_level = order_book.bids[Decimal("50000")]
        
        order_ids = [order.order_id for order in price_level.orders]
        assert order_ids == ["BUY-0", "BUY-1", "BUY-2"]
        
        # Cleanup
        os.remove(filepath)
        os.rmdir("test_snapshots")
        
        print("✓ Persistence preserves price-time priority")
    
    def test_manual_snapshot(self):
        """Test manual snapshot creation."""
        engine = MatchingEngine()
        
        # Add some orders
        buy = create_order("BUY-1", OrderType.LIMIT, Side.BUY, 1.0, 50000)
        engine.process_order(buy)
        
        # Create manual snapshot
        filepath = engine.save_snapshot("manual_test.json")
        assert os.path.exists(filepath)
        
        # Load it
        new_engine = MatchingEngine()
        new_engine.load_snapshot(filepath)
        
        assert "BTC-USDT" in new_engine.order_books
        assert new_engine.order_books["BTC-USDT"].has_order("BUY-1")
        
        # Cleanup
        os.remove(filepath)
        Path("snapshots").rmdir()
        
        print("✓ Manual snapshot works correctly")


class TestAutomaticSnapshots:
    """Tests for automatic snapshot functionality."""
    
    def test_automatic_snapshot_disabled_by_default(self):
        """Test that automatic snapshots are disabled by default."""
        engine = MatchingEngine()
        
        assert engine.enable_persistence is False
        assert engine.snapshot_manager is None
        
        print("✓ Automatic snapshots disabled by default")
    
    def test_automatic_snapshot_enabled(self):
        """Test enabling automatic snapshots."""
        engine = MatchingEngine(enable_persistence=True, snapshot_interval=1)
        
        assert engine.enable_persistence is True
        assert engine.snapshot_manager is not None
        
        print("✓ Automatic snapshots can be enabled")


if __name__ == "__main__":
    print("\n" + "="*70)
    print("PERSISTENCE TESTS")
    print("="*70)
    
    test_classes = [
        TestOrderBookPersistence,
        TestAutomaticSnapshots
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
