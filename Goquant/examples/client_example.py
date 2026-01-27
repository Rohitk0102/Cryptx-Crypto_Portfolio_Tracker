"""Example client for interacting with the matching engine."""

import asyncio
import httpx
import websockets
import json


async def submit_orders():
    """Example: Submit orders via REST API."""
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        # Submit a limit buy order
        buy_order = {
            "symbol": "BTC-USDT",
            "order_type": "limit",
            "side": "buy",
            "quantity": "1.0",
            "price": "49000.00"
        }
        
        response = await client.post("/api/v1/orders", json=buy_order)
        print(f"Buy Order Response: {response.json()}")
        
        # Submit a limit sell order
        sell_order = {
            "symbol": "BTC-USDT",
            "order_type": "limit",
            "side": "sell",
            "quantity": "1.0",
            "price": "51000.00"
        }
        
        response = await client.post("/api/v1/orders", json=sell_order)
        print(f"Sell Order Response: {response.json()}")
        
        # Get order book
        response = await client.get("/api/v1/orderbook/BTC-USDT")
        print(f"Order Book: {response.json()}")


async def stream_market_data():
    """Example: Stream market data via WebSocket."""
    uri = "ws://localhost:8000/ws/market-data/BTC-USDT"
    
    async with websockets.connect(uri) as websocket:
        print("Connected to market data stream")
        
        # Receive updates
        for _ in range(10):
            message = await websocket.recv()
            data = json.loads(message)
            print(f"Market Data: {data}")


async def stream_trades():
    """Example: Stream trades via WebSocket."""
    uri = "ws://localhost:8000/ws/trades/BTC-USDT"
    
    async with websockets.connect(uri) as websocket:
        print("Connected to trade stream")
        
        # Receive updates
        for _ in range(10):
            message = await websocket.recv()
            data = json.loads(message)
            print(f"Trade: {data}")


if __name__ == "__main__":
    print("=== Crypto Matching Engine Client Example ===\n")
    
    # Run examples
    asyncio.run(submit_orders())
