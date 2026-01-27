"""Integration tests for REST API endpoints."""

import pytest
from httpx import AsyncClient
from decimal import Decimal

from matching_engine.api.app import create_app


@pytest.fixture
async def client():
    """Create test client."""
    app = create_app()
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_health_check(client):
    """Test health check endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_submit_limit_order(client):
    """Test submitting a limit order."""
    order_data = {
        "symbol": "BTC-USDT",
        "order_type": "limit",
        "side": "buy",
        "quantity": "1.0",
        "price": "50000.00"
    }
    
    response = await client.post("/api/v1/orders", json=order_data)
    assert response.status_code == 201
    
    data = response.json()
    assert "order_id" in data
    assert data["status"] in ["accepted", "filled", "partial"]



@pytest.mark.asyncio
async def test_submit_market_order(client):
    """Test submitting a market order."""
    order_data = {
        "symbol": "BTC-USDT",
        "order_type": "market",
        "side": "buy",
        "quantity": "1.0"
    }
    
    response = await client.post("/api/v1/orders", json=order_data)
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_submit_invalid_order(client):
    """Test submitting invalid order."""
    order_data = {
        "symbol": "BTC-USDT",
        "order_type": "limit",
        "side": "buy",
        "quantity": "1.0"
        # Missing required price
    }
    
    response = await client.post("/api/v1/orders", json=order_data)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_orderbook(client):
    """Test getting order book snapshot."""
    response = await client.get("/api/v1/orderbook/BTC-USDT")
    assert response.status_code == 200
    
    data = response.json()
    assert "symbol" in data
    assert "bids" in data
    assert "asks" in data
