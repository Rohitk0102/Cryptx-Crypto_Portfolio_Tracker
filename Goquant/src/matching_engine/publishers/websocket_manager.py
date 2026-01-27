"""WebSocket connection manager for real-time data streaming."""

from typing import Set
from fastapi import WebSocket
import json


class WebSocketManager:
    """
    Manages WebSocket connections and message broadcasting.
    
    Maintains separate connection pools for each trading symbol.
    """
    
    def __init__(self):
        """Initialize WebSocket manager."""
        # Map of symbol -> set of WebSocket connections
        self.connections: dict[str, Set[WebSocket]] = {}
        self.logger = None
    
    def set_logger(self, logger):
        """
        Set logger instance.
        
        Args:
            logger: Structured logger
        """
        self.logger = logger
    
    async def connect(self, websocket: WebSocket, symbol: str):
        """
        Add new WebSocket subscriber for a symbol.
        
        Args:
            websocket: WebSocket connection
            symbol: Trading symbol to subscribe to
        """
        await websocket.accept()
        
        if symbol not in self.connections:
            self.connections[symbol] = set()
        
        self.connections[symbol].add(websocket)
        
        if self.logger:
            self.logger.info(
                "websocket_connected",
                symbol=symbol,
                total_connections=len(self.connections[symbol])
            )
    
    async def disconnect(self, websocket: WebSocket, symbol: str):
        """
        Remove WebSocket subscriber and handle cleanup.
        
        Args:
            websocket: WebSocket connection to remove
            symbol: Trading symbol
        """
        if symbol in self.connections:
            self.connections[symbol].discard(websocket)
            
            # Clean up empty connection sets
            if not self.connections[symbol]:
                del self.connections[symbol]
            
            if self.logger:
                remaining = len(self.connections.get(symbol, []))
                self.logger.info(
                    "websocket_disconnected",
                    symbol=symbol,
                    remaining_connections=remaining
                )
    
    async def broadcast(self, symbol: str, message: dict):
        """
        Send message to all subscribers of a symbol.
        
        Handles disconnected clients gracefully by removing them
        from the connection pool.
        
        Args:
            symbol: Trading symbol
            message: Message dictionary to broadcast
        """
        if symbol not in self.connections:
            return
        
        # Convert message to JSON
        message_json = json.dumps(message)
        
        # Track disconnected clients
        disconnected = []
        
        # Broadcast to all connections
        for websocket in self.connections[symbol].copy():
            try:
                await websocket.send_text(message_json)
            except Exception as e:
                # Connection failed, mark for removal
                disconnected.append(websocket)
                if self.logger:
                    self.logger.warning(
                        "websocket_send_failed",
                        symbol=symbol,
                        error=str(e)
                    )
        
        # Remove disconnected clients
        for websocket in disconnected:
            await self.disconnect(websocket, symbol)
    
    async def send_personal(self, websocket: WebSocket, message: dict):
        """
        Send message to a specific WebSocket connection.
        
        Args:
            websocket: Target WebSocket connection
            message: Message dictionary to send
        """
        try:
            message_json = json.dumps(message)
            await websocket.send_text(message_json)
        except Exception as e:
            if self.logger:
                self.logger.warning(
                    "websocket_personal_send_failed",
                    error=str(e)
                )
    
    def get_connection_count(self, symbol: str) -> int:
        """
        Get number of active connections for a symbol.
        
        Args:
            symbol: Trading symbol
            
        Returns:
            Number of active connections
        """
        return len(self.connections.get(symbol, set()))
    
    def get_total_connections(self) -> int:
        """
        Get total number of active connections across all symbols.
        
        Returns:
            Total connection count
        """
        return sum(len(conns) for conns in self.connections.values())
