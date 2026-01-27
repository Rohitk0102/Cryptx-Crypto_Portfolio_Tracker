"""Order book implementation with price-time priority."""

from collections import deque
from decimal import Decimal
from typing import Optional, List, Tuple
from sortedcontainers import SortedDict

from .models import Order, Side, BBO
from .exceptions import OrderNotFoundError


class PriceLevel:
    """
    Represents a price level in the order book with FIFO queue of orders.
    """
    
    def __init__(self, price: Decimal):
        """
        Initialize price level.
        
        Args:
            price: Price for this level
        """
        self.price = price
        self.orders: deque[Order] = deque()
        self.total_quantity = Decimal("0")
    
    def add_order(self, order: Order):
        """
        Add order to this price level (FIFO).
        
        Args:
            order: Order to add
        """
        self.orders.append(order)
        self.total_quantity += order.remaining_quantity
    
    def remove_order(self, order: Order):
        """
        Remove order from this price level.
        
        Args:
            order: Order to remove
        """
        self.orders.remove(order)
        self.total_quantity -= order.remaining_quantity
    
    def update_quantity(self, old_qty: Decimal, new_qty: Decimal):
        """
        Update total quantity when an order's remaining quantity changes.
        
        Args:
            old_qty: Previous remaining quantity
            new_qty: New remaining quantity
        """
        self.total_quantity = self.total_quantity - old_qty + new_qty
    
    def is_empty(self) -> bool:
        """Check if price level has no orders."""
        return len(self.orders) == 0


class OrderBook:
    """
    Order book maintaining buy and sell orders with price-time priority.
    
    Uses SortedDict for O(log n) insertion/deletion and O(1) best price access.
    Maintains FIFO queues at each price level for time priority.
    """
    
    def __init__(self, symbol: str):
        """
        Initialize order book for a symbol.
        
        Args:
            symbol: Trading pair symbol (e.g., "BTC-USDT")
        """
        self.symbol = symbol
        # Bids sorted in descending order (highest first)
        self.bids: SortedDict[Decimal, PriceLevel] = SortedDict(lambda x: -x)
        # Asks sorted in ascending order (lowest first)
        self.asks: SortedDict[Decimal, PriceLevel] = SortedDict()
        # Order index for O(1) lookup by order ID
        self.order_index: dict[str, tuple[Order, Side]] = {}
    
    def add_order(self, order: Order):
        """
        Add order to the order book at appropriate price level.
        
        Complexity: O(log n) for price level insertion
        
        Args:
            order: Order to add to book
        """
        if order.side == Side.BUY:
            price_levels = self.bids
        else:
            price_levels = self.asks
        
        # Get or create price level
        if order.price not in price_levels:
            price_levels[order.price] = PriceLevel(order.price)
        
        price_level = price_levels[order.price]
        price_level.add_order(order)
        
        # Add to order index
        self.order_index[order.order_id] = (order, order.side)
    
    def remove_order(self, order_id: str) -> Order:
        """
        Remove order from the order book.
        
        Complexity: O(log n) for price level deletion if level becomes empty
        
        Args:
            order_id: ID of order to remove
            
        Returns:
            Removed order
            
        Raises:
            OrderNotFoundError: If order ID not found
        """
        if order_id not in self.order_index:
            raise OrderNotFoundError(f"Order {order_id} not found")
        
        order, side = self.order_index[order_id]
        
        # Get price levels
        if side == Side.BUY:
            price_levels = self.bids
        else:
            price_levels = self.asks
        
        # Remove from price level
        price_level = price_levels[order.price]
        price_level.remove_order(order)
        
        # Remove empty price level
        if price_level.is_empty():
            del price_levels[order.price]
        
        # Remove from order index
        del self.order_index[order_id]
        
        return order
    
    def update_order_quantity(self, order: Order, old_qty: Decimal):
        """
        Update order quantity in the order book.
        
        Args:
            order: Order with updated quantity
            old_qty: Previous remaining quantity
        """
        if order.side == Side.BUY:
            price_levels = self.bids
        else:
            price_levels = self.asks
        
        if order.price in price_levels:
            price_level = price_levels[order.price]
            price_level.update_quantity(old_qty, order.remaining_quantity)
            
            # Remove empty price level
            if price_level.is_empty():
                del price_levels[order.price]
    
    def get_best_bid(self) -> Optional[Tuple[Decimal, PriceLevel]]:
        """
        Get best (highest) bid price level.
        
        Complexity: O(1)
        
        Returns:
            Tuple of (price, price_level) or None if no bids
        """
        if not self.bids:
            return None
        
        # SortedDict with reverse order - first key is highest
        best_price = self.bids.keys()[0]
        return best_price, self.bids[best_price]
    
    def get_best_ask(self) -> Optional[Tuple[Decimal, PriceLevel]]:
        """
        Get best (lowest) ask price level.
        
        Complexity: O(1)
        
        Returns:
            Tuple of (price, price_level) or None if no asks
        """
        if not self.asks:
            return None
        
        # SortedDict with normal order - first key is lowest
        best_price = self.asks.keys()[0]
        return best_price, self.asks[best_price]
    
    def get_depth(self, levels: int = 10) -> Tuple[List[Tuple[str, str]], List[Tuple[str, str]]]:
        """
        Get order book depth (top N price levels).
        
        Complexity: O(k) where k is number of levels
        
        Args:
            levels: Number of price levels to return (default 10)
            
        Returns:
            Tuple of (bids, asks) where each is list of (price, quantity) tuples
        """
        # Get top bid levels (highest to lowest)
        bids = []
        for i, (price, level) in enumerate(self.bids.items()):
            if i >= levels:
                break
            bids.append((str(price), str(level.total_quantity)))
        
        # Get top ask levels (lowest to highest)
        asks = []
        for i, (price, level) in enumerate(self.asks.items()):
            if i >= levels:
                break
            asks.append((str(price), str(level.total_quantity)))
        
        return bids, asks
    
    def calculate_bbo(self) -> BBO:
        """
        Calculate current Best Bid and Offer.
        
        Complexity: O(1)
        
        Returns:
            BBO object with best bid and ask prices and quantities
        """
        from datetime import datetime
        
        best_bid = None
        best_bid_qty = Decimal("0")
        
        best_bid_data = self.get_best_bid()
        if best_bid_data:
            best_bid, best_bid_level = best_bid_data
            best_bid_qty = best_bid_level.total_quantity
        
        best_ask = None
        best_ask_qty = Decimal("0")
        
        best_ask_data = self.get_best_ask()
        if best_ask_data:
            best_ask, best_ask_level = best_ask_data
            best_ask_qty = best_ask_level.total_quantity
        
        return BBO(
            symbol=self.symbol,
            best_bid=best_bid,
            best_bid_quantity=best_bid_qty,
            best_ask=best_ask,
            best_ask_quantity=best_ask_qty,
            timestamp=datetime.utcnow()
        )
    
    def has_order(self, order_id: str) -> bool:
        """
        Check if order exists in the book.
        
        Args:
            order_id: Order ID to check
            
        Returns:
            True if order exists
        """
        return order_id in self.order_index
    
    def get_order(self, order_id: str) -> Optional[Order]:
        """
        Get order by ID.
        
        Args:
            order_id: Order ID to retrieve
            
        Returns:
            Order if found, None otherwise
        """
        if order_id in self.order_index:
            return self.order_index[order_id][0]
        return None
