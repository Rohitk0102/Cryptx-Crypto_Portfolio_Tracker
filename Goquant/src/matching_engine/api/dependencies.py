"""Dependency injection for API endpoints."""

from typing import Annotated
from fastapi import Depends

# Global instances (will be set during app initialization)
_matching_engine = None
_websocket_manager = None
_logger = None


def set_matching_engine(engine):
    """Set global matching engine instance."""
    global _matching_engine
    _matching_engine = engine


def set_websocket_manager(manager):
    """Set global WebSocket manager instance."""
    global _websocket_manager
    _websocket_manager = manager


def set_logger(logger):
    """Set global logger instance."""
    global _logger
    _logger = logger


def get_matching_engine():
    """Dependency to get matching engine instance."""
    return _matching_engine


def get_websocket_manager():
    """Dependency to get WebSocket manager instance."""
    return _websocket_manager


def get_logger():
    """Dependency to get logger instance."""
    return _logger


# Type aliases for dependency injection
MatchingEngineDep = Annotated[object, Depends(get_matching_engine)]
WebSocketManagerDep = Annotated[object, Depends(get_websocket_manager)]
LoggerDep = Annotated[object, Depends(get_logger)]
