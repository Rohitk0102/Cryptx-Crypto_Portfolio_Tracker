"""Pydantic schemas for API request/response validation."""

from decimal import Decimal
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator

from ..core.models import OrderType, Side


class OrderRequest(BaseModel):
    """Request schema for order submission."""
    
    symbol: str = Field(..., pattern="^[A-Z]+-[A-Z]+$", description="Trading pair symbol (e.g., BTC-USDT)")
    order_type: OrderType = Field(..., description="Order type: market, limit, ioc, fok, stop_loss, stop_limit, take_profit")
    side: Side = Field(..., description="Order side: buy or sell")
    quantity: Decimal = Field(..., gt=0, description="Order quantity (must be positive)")
    price: Optional[Decimal] = Field(None, gt=0, description="Limit price (required for limit, ioc, fok, stop_limit)")
    stop_price: Optional[Decimal] = Field(None, gt=0, description="Stop price (required for stop_loss, stop_limit, take_profit)")
    
    @field_validator('price')
    @classmethod
    def validate_price(cls, v, info):
        """Validate that price is provided for non-market orders."""
        order_type = info.data.get('order_type')
        if order_type in [OrderType.LIMIT, OrderType.IOC, OrderType.FOK, OrderType.STOP_LIMIT]:
            if v is None:
                raise ValueError(f"Price required for {order_type.value} orders")
        return v
    
    @field_validator('stop_price')
    @classmethod
    def validate_stop_price(cls, v, info):
        """Validate that stop_price is provided for stop orders."""
        order_type = info.data.get('order_type')
        if order_type in [OrderType.STOP_LOSS, OrderType.STOP_LIMIT, OrderType.TAKE_PROFIT]:
            if v is None:
                raise ValueError(f"Stop price required for {order_type.value} orders")
        return v
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "symbol": "BTC-USDT",
                    "order_type": "limit",
                    "side": "buy",
                    "quantity": "0.5",
                    "price": "50000.00"
                }
            ]
        }
    }


class OrderResponse(BaseModel):
    """Response schema for order submission."""
    
    order_id: str = Field(..., description="Unique order identifier")
    status: str = Field(..., description="Order status: accepted, filled, partial, cancelled")
    timestamp: datetime = Field(..., description="Order processing timestamp")
    message: Optional[str] = Field(None, description="Additional information or error message")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "order_id": "ORD-0000000001",
                    "status": "accepted",
                    "timestamp": "2025-10-26T12:34:56.789Z"
                }
            ]
        }
    }


class OrderStatusResponse(BaseModel):
    """Response schema for order status query."""
    
    order_id: str
    symbol: str
    order_type: str
    side: str
    quantity: str
    price: Optional[str]
    remaining_quantity: str
    status: str
    timestamp: datetime


class OrderBookResponse(BaseModel):
    """Response schema for order book snapshot."""
    
    symbol: str
    timestamp: datetime
    bids: list[tuple[str, str]]  # [(price, quantity), ...]
    asks: list[tuple[str, str]]  # [(price, quantity), ...]
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "symbol": "BTC-USDT",
                    "timestamp": "2025-10-26T12:34:56.789Z",
                    "bids": [["49999.50", "2.5"], ["49999.00", "5.0"]],
                    "asks": [["50000.00", "1.8"], ["50000.50", "3.2"]]
                }
            ]
        }
    }


class ErrorResponse(BaseModel):
    """Response schema for errors."""
    
    detail: str = Field(..., description="Error message")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "detail": "Invalid order parameters"
                }
            ]
        }
    }
