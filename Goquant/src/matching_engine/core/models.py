"""Core data models for the matching engine."""

from enum import Enum
from decimal import Decimal
from datetime import datetime
from typing import Optional
from dataclasses import dataclass, field


class OrderType(str, Enum):
    """Order type enumeration."""
    MARKET = "market"
    LIMIT = "limit"
    IOC = "ioc"
    FOK = "fok"
    STOP_LOSS = "stop_loss"
    STOP_LIMIT = "stop_limit"
    TAKE_PROFIT = "take_profit"


class Side(str, Enum):
    """Order side enumeration."""
    BUY = "buy"
    SELL = "sell"


class OrderStatus(str, Enum):
    """Order status enumeration."""
    NEW = "new"
    PARTIAL = "partial"
    FILLED = "filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


@dataclass
class Order:
    """Represents a trading order."""
    
    order_id: str
    symbol: str
    order_type: OrderType
    side: Side
    quantity: Decimal
    price: Optional[Decimal]
    timestamp: datetime
    remaining_quantity: Decimal
    status: OrderStatus = OrderStatus.NEW
    stop_price: Optional[Decimal] = None  # Trigger price for stop orders
    is_triggered: bool = False  # Whether stop order has been triggered
    
    def __post_init__(self):
        """Validate order after initialization."""
        if self.quantity <= 0:
            raise ValueError("Quantity must be positive")
        
        if self.order_type in [OrderType.LIMIT, OrderType.IOC, OrderType.FOK]:
            if self.price is None:
                raise ValueError(f"Price required for {self.order_type.value} orders")
            if self.price <= 0:
                raise ValueError("Price must be positive")
        
        # Stop orders require stop_price
        if self.order_type in [OrderType.STOP_LOSS, OrderType.STOP_LIMIT, OrderType.TAKE_PROFIT]:
            if self.stop_price is None:
                raise ValueError(f"Stop price required for {self.order_type.value} orders")
            if self.stop_price <= 0:
                raise ValueError("Stop price must be positive")
        
        # Stop-limit also requires limit price
        if self.order_type == OrderType.STOP_LIMIT:
            if self.price is None:
                raise ValueError("Limit price required for stop-limit orders")
            if self.price <= 0:
                raise ValueError("Limit price must be positive")
        
        if self.remaining_quantity < 0:
            raise ValueError("Remaining quantity cannot be negative")
        
        if self.remaining_quantity > self.quantity:
            raise ValueError("Remaining quantity cannot exceed total quantity")
    
    def is_marketable(self, best_bid: Optional[Decimal], best_ask: Optional[Decimal]) -> bool:
        """
        Check if order can immediately match against the order book.
        
        Args:
            best_bid: Current best bid price
            best_ask: Current best ask price
            
        Returns:
            True if order can match immediately
        """
        if self.order_type == OrderType.MARKET:
            return True
        
        if self.side == Side.BUY:
            # Buy order is marketable if price >= best ask
            return best_ask is not None and self.price >= best_ask
        else:
            # Sell order is marketable if price <= best bid
            return best_bid is not None and self.price <= best_bid
    
    def can_rest_on_book(self) -> bool:
        """
        Check if order type allows resting on the order book.
        
        Returns:
            True if order can rest on book
        """
        return self.order_type == OrderType.LIMIT
    
    def is_filled(self) -> bool:
        """Check if order is completely filled."""
        return self.remaining_quantity == 0
    
    def update_status(self):
        """Update order status based on remaining quantity."""
        if self.remaining_quantity == 0:
            self.status = OrderStatus.FILLED
        elif self.remaining_quantity < self.quantity:
            self.status = OrderStatus.PARTIAL


@dataclass
class Trade:
    """Represents an executed trade."""
    
    trade_id: str
    symbol: str
    price: Decimal
    quantity: Decimal
    timestamp: datetime
    maker_order_id: str
    taker_order_id: str
    aggressor_side: Side
    maker_fee: Decimal = Decimal("0")
    taker_fee: Decimal = Decimal("0")
    maker_fee_rate: Decimal = Decimal("0")
    taker_fee_rate: Decimal = Decimal("0")
    
    def __post_init__(self):
        """Validate trade after initialization."""
        if self.price <= 0:
            raise ValueError("Trade price must be positive")
        if self.quantity <= 0:
            raise ValueError("Trade quantity must be positive")
    
    def to_dict(self) -> dict:
        """
        Serialize trade to dictionary for API response.
        
        Returns:
            Dictionary representation of trade
        """
        result = {
            "trade_id": self.trade_id,
            "symbol": self.symbol,
            "price": str(self.price),
            "quantity": str(self.quantity),
            "timestamp": self.timestamp.isoformat(),
            "maker_order_id": self.maker_order_id,
            "taker_order_id": self.taker_order_id,
            "aggressor_side": self.aggressor_side.value
        }
        
        # Include fees if present
        if self.maker_fee > 0 or self.taker_fee > 0:
            result["maker_fee"] = str(self.maker_fee)
            result["taker_fee"] = str(self.taker_fee)
            result["maker_fee_rate"] = str(self.maker_fee_rate)
            result["taker_fee_rate"] = str(self.taker_fee_rate)
        
        return result


@dataclass
class BBO:
    """Best Bid and Offer representation."""
    
    symbol: str
    best_bid: Optional[Decimal]
    best_bid_quantity: Decimal
    best_ask: Optional[Decimal]
    best_ask_quantity: Decimal
    timestamp: datetime
    
    def to_dict(self) -> dict:
        """
        Serialize BBO to dictionary for API response.
        
        Returns:
            Dictionary representation of BBO
        """
        return {
            "type": "bbo",
            "symbol": self.symbol,
            "best_bid": str(self.best_bid) if self.best_bid is not None else None,
            "best_bid_quantity": str(self.best_bid_quantity),
            "best_ask": str(self.best_ask) if self.best_ask is not None else None,
            "best_ask_quantity": str(self.best_ask_quantity),
            "timestamp": self.timestamp.isoformat()
        }


@dataclass
class OrderBookSnapshot:
    """L2 order book snapshot with aggregated price levels."""
    
    symbol: str
    timestamp: datetime
    bids: list[tuple[str, str]]  # [(price, quantity), ...]
    asks: list[tuple[str, str]]  # [(price, quantity), ...]
    
    def to_dict(self) -> dict:
        """
        Serialize order book snapshot to dictionary for API response.
        
        Returns:
            Dictionary representation of order book
        """
        return {
            "type": "orderbook",
            "symbol": self.symbol,
            "timestamp": self.timestamp.isoformat(),
            "bids": self.bids,
            "asks": self.asks
        }


@dataclass
class OrderResult:
    """Result of order processing."""
    
    order_id: str
    status: str
    timestamp: datetime
    message: Optional[str] = None
    trades: list[Trade] = field(default_factory=list)
    remaining_quantity: Decimal = Decimal("0")
    
    def to_dict(self) -> dict:
        """
        Serialize order result to dictionary.
        
        Returns:
            Dictionary representation of order result
        """
        result = {
            "order_id": self.order_id,
            "status": self.status,
            "timestamp": self.timestamp.isoformat(),
        }
        
        if self.message:
            result["message"] = self.message
        
        if self.trades:
            result["trades"] = [trade.to_dict() for trade in self.trades]
        
        if self.remaining_quantity > 0:
            result["remaining_quantity"] = str(self.remaining_quantity)
        
        return result
