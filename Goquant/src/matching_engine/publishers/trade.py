"""Trade publisher for real-time trade execution streaming."""

from ..core.models import Trade


class TradePublisher:
    """
    Publishes real-time trade executions via WebSocket.
    """
    
    def __init__(self, websocket_manager=None):
        """
        Initialize trade publisher.
        
        Args:
            websocket_manager: WebSocket manager for broadcasting trades
        """
        self.websocket_manager = websocket_manager
    
    async def publish_trade(self, trade: Trade):
        """
        Publish trade execution to all subscribers.
        
        The aggressor side is identified as the side of the incoming
        (taker) order that initiated the trade.
        
        Args:
            trade: Trade execution to publish
        """
        if self.websocket_manager:
            message = trade.to_dict()
            message["type"] = "trade"
            await self.websocket_manager.broadcast(trade.symbol, message)
