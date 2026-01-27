"""Market data publisher for BBO and order book updates."""

from datetime import datetime
from typing import Optional

from ..core.models import BBO, OrderBookSnapshot
from ..core.order_book import OrderBook


class MarketDataPublisher:
    """
    Publishes real-time BBO and L2 order book updates via WebSocket.
    """
    
    def __init__(self, websocket_manager=None):
        """
        Initialize market data publisher.
        
        Args:
            websocket_manager: WebSocket manager for broadcasting updates
        """
        self.websocket_manager = websocket_manager
        self.bbo_cache: dict[str, BBO] = {}
    
    async def publish_bbo_update(self, symbol: str, bbo: BBO):
        """
        Publish BBO update to all subscribers.
        
        Args:
            symbol: Trading symbol
            bbo: Best bid and offer data
        """
        # Cache BBO
        self.bbo_cache[symbol] = bbo
        
        # Broadcast to WebSocket subscribers
        if self.websocket_manager:
            message = bbo.to_dict()
            await self.websocket_manager.broadcast(symbol, message)
    
    async def publish_orderbook_update(self, symbol: str, order_book: OrderBook):
        """
        Publish L2 order book snapshot to all subscribers.
        
        Args:
            symbol: Trading symbol
            order_book: Order book instance
        """
        # Generate order book snapshot (top 10 levels)
        snapshot = self._get_orderbook_snapshot(order_book, levels=10)
        
        # Broadcast to WebSocket subscribers
        if self.websocket_manager:
            message = snapshot.to_dict()
            await self.websocket_manager.broadcast(symbol, message)
    
    def _get_orderbook_snapshot(self, order_book: OrderBook, levels: int = 10) -> OrderBookSnapshot:
        """
        Generate order book snapshot with top N price levels.
        
        Args:
            order_book: Order book to snapshot
            levels: Number of price levels to include
            
        Returns:
            OrderBookSnapshot with bids and asks
        """
        bids, asks = order_book.get_depth(levels)
        
        return OrderBookSnapshot(
            symbol=order_book.symbol,
            timestamp=datetime.utcnow(),
            bids=bids,
            asks=asks
        )
    
    def get_cached_bbo(self, symbol: str) -> Optional[BBO]:
        """
        Get cached BBO for a symbol.
        
        Args:
            symbol: Trading symbol
            
        Returns:
            Cached BBO or None
        """
        return self.bbo_cache.get(symbol)
