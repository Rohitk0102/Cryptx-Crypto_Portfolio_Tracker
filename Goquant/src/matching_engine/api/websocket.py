"""WebSocket API endpoints for real-time market data streaming."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from .dependencies import MatchingEngineDep, WebSocketManagerDep, LoggerDep

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/market-data/{symbol}")
async def market_data_websocket(
    websocket: WebSocket,
    symbol: str,
    ws_manager: WebSocketManagerDep,
    engine: MatchingEngineDep,
    logger: LoggerDep
):
    """
    WebSocket endpoint for real-time market data streaming.
    
    Streams:
    - BBO (Best Bid and Offer) updates
    - L2 order book snapshots (top 10 levels)
    
    Args:
        websocket: WebSocket connection
        symbol: Trading pair symbol (e.g., BTC-USDT)
    """
    await ws_manager.connect(websocket, symbol)
    
    try:
        # Send initial order book snapshot
        snapshot = engine.get_order_book_snapshot(symbol, levels=10)
        if snapshot:
            await ws_manager.send_personal(websocket, snapshot.to_dict())
        
        # Send initial BBO if available
        if engine.market_data_publisher:
            cached_bbo = engine.market_data_publisher.get_cached_bbo(symbol)
            if cached_bbo:
                await ws_manager.send_personal(websocket, cached_bbo.to_dict())
        
        # Keep connection alive and handle incoming messages
        while True:
            # Wait for messages (can be used for subscription management)
            data = await websocket.receive_text()
            
            # Echo back for heartbeat/ping
            await websocket.send_text(f"Subscribed to {symbol}")
            
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket, symbol)
        if logger:
            logger.info("market_data_websocket_disconnected", symbol=symbol)
    except Exception as e:
        if logger:
            logger.error("market_data_websocket_error", symbol=symbol, error=str(e))
        await ws_manager.disconnect(websocket, symbol)


@router.websocket("/ws/trades/{symbol}")
async def trades_websocket(
    websocket: WebSocket,
    symbol: str,
    ws_manager: WebSocketManagerDep,
    logger: LoggerDep
):
    """
    WebSocket endpoint for real-time trade execution streaming.
    
    Streams:
    - Trade executions with price, quantity, aggressor side
    - Maker and taker order IDs
    
    Args:
        websocket: WebSocket connection
        symbol: Trading pair symbol (e.g., BTC-USDT)
    """
    await ws_manager.connect(websocket, symbol)
    
    try:
        # Send confirmation message
        await websocket.send_text(f"Subscribed to trades for {symbol}")
        
        # Keep connection alive and handle incoming messages
        while True:
            # Wait for messages (can be used for subscription management)
            data = await websocket.receive_text()
            
            # Echo back for heartbeat/ping
            await websocket.send_text(f"Trade feed active for {symbol}")
            
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket, symbol)
        if logger:
            logger.info("trades_websocket_disconnected", symbol=symbol)
    except Exception as e:
        if logger:
            logger.error("trades_websocket_error", symbol=symbol, error=str(e))
        await ws_manager.disconnect(websocket, symbol)
