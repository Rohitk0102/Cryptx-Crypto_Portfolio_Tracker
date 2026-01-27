"""FastAPI application setup and configuration."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ..core.engine import MatchingEngine
from ..publishers.websocket_manager import WebSocketManager
from ..publishers.market_data import MarketDataPublisher
from ..publishers.trade import TradePublisher
from ..utils.config import get_settings
from ..utils.logging import configure_logging
from . import dependencies
from .routes import router as api_router
from .websocket import router as ws_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager for startup and shutdown events.
    
    Args:
        app: FastAPI application instance
    """
    # Startup
    settings = get_settings()
    logger = configure_logging(
        log_level=settings.log_level,
        log_format=settings.log_format
    )
    
    logger.info(
        "application_starting",
        host=settings.api_host,
        port=settings.api_port
    )
    
    # Initialize components
    websocket_manager = WebSocketManager()
    websocket_manager.set_logger(logger)
    
    market_data_publisher = MarketDataPublisher(websocket_manager)
    trade_publisher = TradePublisher(websocket_manager)
    
    matching_engine = MatchingEngine()
    matching_engine.set_publishers(market_data_publisher, trade_publisher)
    matching_engine.set_logger(logger)
    
    # Set dependencies
    dependencies.set_matching_engine(matching_engine)
    dependencies.set_websocket_manager(websocket_manager)
    dependencies.set_logger(logger)
    
    logger.info("application_started")
    
    yield
    
    # Shutdown
    logger.info("application_shutting_down")
    # Cleanup resources here if needed
    logger.info("application_stopped")


def create_app() -> FastAPI:
    """
    Create and configure FastAPI application.
    
    Returns:
        Configured FastAPI application
    """
    app = FastAPI(
        title="Crypto Matching Engine",
        description="High-performance cryptocurrency matching engine with REG NMS-inspired price-time priority",
        version="0.1.0",
        lifespan=lifespan
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure appropriately for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include routers
    app.include_router(api_router)
    app.include_router(ws_router)
    
    # Health check endpoint
    @app.get("/health", tags=["health"])
    async def health_check():
        """Health check endpoint."""
        return {
            "status": "healthy",
            "service": "crypto-matching-engine"
        }
    
    return app


# Create app instance
app = create_app()
