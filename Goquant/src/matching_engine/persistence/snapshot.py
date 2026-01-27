"""Order book snapshot and persistence implementation."""

import json
import pickle
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any
from decimal import Decimal

from ..core.order_book import OrderBook
from ..core.models import Order, OrderType, Side, OrderStatus


class OrderBookSnapshot:
    """Handles order book state persistence and recovery."""
    
    def __init__(self, snapshot_dir: str = "snapshots"):
        """
        Initialize snapshot manager.
        
        Args:
            snapshot_dir: Directory to store snapshots
        """
        self.snapshot_dir = Path(snapshot_dir)
        self.snapshot_dir.mkdir(parents=True, exist_ok=True)
    
    def save_order_book(self, order_book: OrderBook, filename: Optional[str] = None) -> str:
        """
        Save order book state to disk.
        
        Args:
            order_book: OrderBook to save
            filename: Optional filename, defaults to symbol_timestamp.json
            
        Returns:
            Path to saved snapshot file
        """
        if filename is None:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"{order_book.symbol}_{timestamp}.json"
        
        filepath = self.snapshot_dir / filename
        
        # Serialize order book state
        snapshot_data = {
            "symbol": order_book.symbol,
            "timestamp": datetime.utcnow().isoformat(),
            "bids": self._serialize_price_levels(order_book.bids),
            "asks": self._serialize_price_levels(order_book.asks),
            "order_index": self._serialize_order_index(order_book.order_index)
        }
        
        # Write to file
        with open(filepath, 'w') as f:
            json.dump(snapshot_data, f, indent=2)
        
        return str(filepath)
    
    def load_order_book(self, filepath: str) -> OrderBook:
        """
        Load order book state from disk.
        
        Args:
            filepath: Path to snapshot file
            
        Returns:
            Restored OrderBook instance
        """
        with open(filepath, 'r') as f:
            snapshot_data = json.load(f)
        
        # Create new order book
        order_book = OrderBook(snapshot_data["symbol"])
        
        # Restore orders from snapshot
        orders_to_restore = []
        
        # Restore bid orders
        for price_str, orders_data in snapshot_data["bids"].items():
            for order_data in orders_data:
                order = self._deserialize_order(order_data)
                orders_to_restore.append(order)
        
        # Restore ask orders
        for price_str, orders_data in snapshot_data["asks"].items():
            for order_data in orders_data:
                order = self._deserialize_order(order_data)
                orders_to_restore.append(order)
        
        # Add orders to book in original time order
        orders_to_restore.sort(key=lambda o: o.timestamp)
        for order in orders_to_restore:
            order_book.add_order(order)
        
        return order_book
    
    def save_engine_state(self, engine, filename: Optional[str] = None) -> str:
        """
        Save complete matching engine state.
        
        Args:
            engine: MatchingEngine instance
            filename: Optional filename
            
        Returns:
            Path to saved state file
        """
        if filename is None:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"engine_state_{timestamp}.json"
        
        filepath = self.snapshot_dir / filename
        
        # Serialize engine state
        state_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "trade_id_counter": engine.trade_id_counter,
            "order_id_counter": engine.order_id_counter,
            "order_books": {},
            "stop_orders": {}
        }
        
        # Save each order book
        for symbol, order_book in engine.order_books.items():
            state_data["order_books"][symbol] = {
                "bids": self._serialize_price_levels(order_book.bids),
                "asks": self._serialize_price_levels(order_book.asks),
                "order_index": self._serialize_order_index(order_book.order_index)
            }
        
        # Save stop orders
        for symbol, stop_order_list in engine.stop_orders.items():
            state_data["stop_orders"][symbol] = [
                self._serialize_order(order) for order in stop_order_list
            ]
        
        # Write to file
        with open(filepath, 'w') as f:
            json.dump(state_data, f, indent=2)
        
        return str(filepath)
    
    def load_engine_state(self, engine, filepath: str):
        """
        Load matching engine state from disk.
        
        Args:
            engine: MatchingEngine instance to restore into
            filepath: Path to state file
        """
        with open(filepath, 'r') as f:
            state_data = json.load(f)
        
        # Restore counters
        engine.trade_id_counter = state_data["trade_id_counter"]
        engine.order_id_counter = state_data["order_id_counter"]
        
        # Restore order books
        engine.order_books.clear()
        for symbol, book_data in state_data["order_books"].items():
            order_book = OrderBook(symbol)
            
            # Restore orders
            orders_to_restore = []
            
            for price_str, orders_data in book_data["bids"].items():
                for order_data in orders_data:
                    order = self._deserialize_order(order_data)
                    orders_to_restore.append(order)
            
            for price_str, orders_data in book_data["asks"].items():
                for order_data in orders_data:
                    order = self._deserialize_order(order_data)
                    orders_to_restore.append(order)
            
            # Add orders in time order
            orders_to_restore.sort(key=lambda o: o.timestamp)
            for order in orders_to_restore:
                order_book.add_order(order)
            
            engine.order_books[symbol] = order_book
        
        # Restore stop orders
        engine.stop_orders.clear()
        for symbol, stop_orders_data in state_data.get("stop_orders", {}).items():
            engine.stop_orders[symbol] = [
                self._deserialize_order(order_data) for order_data in stop_orders_data
            ]
    
    def _serialize_price_levels(self, price_levels) -> Dict[str, list]:
        """Serialize price levels to JSON-compatible format."""
        result = {}
        for price, level in price_levels.items():
            result[str(price)] = [
                self._serialize_order(order) for order in level.orders
            ]
        return result
    
    def _serialize_order_index(self, order_index) -> Dict[str, Any]:
        """Serialize order index."""
        result = {}
        for order_id, (order, side) in order_index.items():
            result[order_id] = {
                "order": self._serialize_order(order),
                "side": side.value
            }
        return result
    
    def _serialize_order(self, order: Order) -> Dict[str, Any]:
        """Serialize order to JSON-compatible format."""
        return {
            "order_id": order.order_id,
            "symbol": order.symbol,
            "order_type": order.order_type.value,
            "side": order.side.value,
            "quantity": str(order.quantity),
            "price": str(order.price) if order.price else None,
            "timestamp": order.timestamp.isoformat(),
            "remaining_quantity": str(order.remaining_quantity),
            "status": order.status.value,
            "stop_price": str(order.stop_price) if order.stop_price else None,
            "is_triggered": order.is_triggered
        }
    
    def _deserialize_order(self, order_data: Dict[str, Any]) -> Order:
        """Deserialize order from JSON format."""
        return Order(
            order_id=order_data["order_id"],
            symbol=order_data["symbol"],
            order_type=OrderType(order_data["order_type"]),
            side=Side(order_data["side"]),
            quantity=Decimal(order_data["quantity"]),
            price=Decimal(order_data["price"]) if order_data["price"] else None,
            timestamp=datetime.fromisoformat(order_data["timestamp"]),
            remaining_quantity=Decimal(order_data["remaining_quantity"]),
            status=OrderStatus(order_data["status"]),
            stop_price=Decimal(order_data["stop_price"]) if order_data.get("stop_price") else None,
            is_triggered=order_data.get("is_triggered", False)
        )
    
    def list_snapshots(self, symbol: Optional[str] = None) -> list:
        """
        List available snapshots.
        
        Args:
            symbol: Optional symbol to filter by
            
        Returns:
            List of snapshot filenames
        """
        pattern = f"{symbol}_*.json" if symbol else "*.json"
        return sorted([f.name for f in self.snapshot_dir.glob(pattern)])
    
    def get_latest_snapshot(self, symbol: Optional[str] = None) -> Optional[str]:
        """
        Get the most recent snapshot file.
        
        Args:
            symbol: Optional symbol to filter by
            
        Returns:
            Path to latest snapshot or None
        """
        snapshots = self.list_snapshots(symbol)
        if snapshots:
            return str(self.snapshot_dir / snapshots[-1])
        return None
