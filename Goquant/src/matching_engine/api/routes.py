"""REST API endpoints for order submission and queries."""

from datetime import datetime
from decimal import Decimal
from fastapi import APIRouter, HTTPException, status

from .schemas import OrderRequest, OrderResponse, OrderBookResponse
from .dependencies import MatchingEngineDep, LoggerDep
from ..core.models import Order, OrderStatus
from ..core.exceptions import (
    OrderValidationError,
    InsufficientLiquidityError,
    OrderNotFoundError
)

router = APIRouter(prefix="/api/v1", tags=["orders"])


@router.post(
    "/orders",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit a new order",
    description="Submit a new order to the matching engine. Returns order ID and status."
)
async def submit_order(
    order_request: OrderRequest,
    engine: MatchingEngineDep,
    logger: LoggerDep
):
    """
    Submit a new order to the matching engine.
    
    - **symbol**: Trading pair (e.g., BTC-USDT)
    - **order_type**: market, limit, ioc, or fok
    - **side**: buy or sell
    - **quantity**: Order quantity (positive decimal)
    - **price**: Limit price (required for limit, ioc, fok orders)
    """
    try:
        # Generate order ID
        order_id = engine.generate_order_id()
        
        # Create order object
        order = Order(
            order_id=order_id,
            symbol=order_request.symbol,
            order_type=order_request.order_type,
            side=order_request.side,
            quantity=order_request.quantity,
            price=order_request.price,
            timestamp=datetime.utcnow(),
            remaining_quantity=order_request.quantity,
            status=OrderStatus.NEW,
            stop_price=order_request.stop_price
        )
        
        # Process order
        result = engine.process_order(order)
        
        return OrderResponse(
            order_id=result.order_id,
            status=result.status,
            timestamp=result.timestamp,
            message=result.message
        )
        
    except OrderValidationError as e:
        if logger:
            logger.error("order_validation_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except InsufficientLiquidityError as e:
        if logger:
            logger.error("insufficient_liquidity", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except ValueError as e:
        if logger:
            logger.error("value_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        if logger:
            logger.error("unexpected_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.delete(
    "/orders/{order_id}",
    status_code=status.HTTP_200_OK,
    summary="Cancel an order",
    description="Cancel an existing order by order ID."
)
async def cancel_order(
    order_id: str,
    symbol: str,
    engine: MatchingEngineDep,
    logger: LoggerDep
):
    """
    Cancel an existing order.
    
    - **order_id**: Unique order identifier
    - **symbol**: Trading pair symbol
    """
    try:
        success = engine.cancel_order(order_id, symbol)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order {order_id} not found"
            )
        
        return {
            "order_id": order_id,
            "status": "cancelled",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        if logger:
            logger.error("cancel_order_error", order_id=order_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.get(
    "/orders/{order_id}",
    status_code=status.HTTP_200_OK,
    summary="Get order status",
    description="Query the status of an order by order ID."
)
async def get_order_status(
    order_id: str,
    symbol: str,
    engine: MatchingEngineDep
):
    """
    Get order status.
    
    - **order_id**: Unique order identifier
    - **symbol**: Trading pair symbol
    """
    if symbol not in engine.order_books:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Symbol {symbol} not found"
        )
    
    order_book = engine.order_books[symbol]
    order = order_book.get_order(order_id)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order {order_id} not found"
        )
    
    return {
        "order_id": order.order_id,
        "symbol": order.symbol,
        "order_type": order.order_type.value,
        "side": order.side.value,
        "quantity": str(order.quantity),
        "price": str(order.price) if order.price else None,
        "remaining_quantity": str(order.remaining_quantity),
        "status": order.status.value,
        "timestamp": order.timestamp.isoformat()
    }


@router.get(
    "/orderbook/{symbol}",
    response_model=OrderBookResponse,
    status_code=status.HTTP_200_OK,
    summary="Get order book snapshot",
    description="Get current order book snapshot with top price levels."
)
async def get_orderbook(
    symbol: str,
    engine: MatchingEngineDep,
    levels: int = 10
):
    """
    Get order book snapshot.
    
    - **symbol**: Trading pair symbol
    - **levels**: Number of price levels to return (default 10)
    """
    snapshot = engine.get_order_book_snapshot(symbol, levels)
    
    if not snapshot:
        # Return empty order book if symbol doesn't exist
        return OrderBookResponse(
            symbol=symbol,
            timestamp=datetime.utcnow(),
            bids=[],
            asks=[]
        )
    
    return OrderBookResponse(
        symbol=snapshot.symbol,
        timestamp=snapshot.timestamp,
        bids=snapshot.bids,
        asks=snapshot.asks
    )
