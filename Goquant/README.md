# Crypto Matching Engine

A high-performance cryptocurrency matching engine implementing REG NMS-inspired price-time priority with real-time market data dissemination.

## Features

- **Order Types**: Market, Limit, IOC (Immediate-Or-Cancel), FOK (Fill-Or-Kill)
- **Price-Time Priority**: Strict FIFO matching at each price level
- **Trade-Through Prevention**: Ensures best price execution
- **Real-Time Streaming**: WebSocket APIs for BBO, L2 order book, and trade executions
- **High Performance**: 1000+ orders/sec with sub-5ms latency
- **RESTful API**: Order submission, cancellation, and status queries

## Quick Start

### Installation

```bash
# Clone repository
git clone <repository-url>
cd crypto-matching-engine

# Install dependencies
pip install -r requirements.txt

# Install package
pip install -e .
```

### Running the Engine

```bash
# Run directly
python -m matching_engine.main

# Or using uvicorn
uvicorn matching_engine.api.app:app --host 0.0.0.0 --port 8000
```

### Using Docker

```bash
# Build and run
docker-compose up --build

# Run in background
docker-compose up -d
```

## API Documentation

### REST API

#### Submit Order

```bash
POST /api/v1/orders
Content-Type: application/json

{
  "symbol": "BTC-USDT",
  "order_type": "limit",
  "side": "buy",
  "quantity": "1.0",
  "price": "50000.00"
}
```

Response:
```json
{
  "order_id": "ORD-0000000001",
  "status": "accepted",
  "timestamp": "2025-10-26T12:34:56.789Z"
}
```

#### Get Order Book

```bash
GET /api/v1/orderbook/BTC-USDT?levels=10
```

### WebSocket API

#### Market Data Stream

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/market-data/BTC-USDT');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
};
```

#### Trade Stream

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/trades/BTC-USDT');
```

## Configuration

Create a `.env` file:

```env
API_HOST=0.0.0.0
API_PORT=8000
LOG_LEVEL=INFO
LOG_FORMAT=json
MAX_WEBSOCKET_CONNECTIONS=1000
ORDER_QUEUE_SIZE=10000
```

## Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=matching_engine

# Run performance benchmarks
python tests/performance/benchmark.py
```

## Simulation

```bash
# Run market data simulator
python scripts/simulate_trading.py
```

## Architecture

- **Core Engine**: Sequential order processing for deterministic matching
- **Order Book**: SortedDict for O(log n) operations, deque for FIFO queues
- **Publishers**: Real-time WebSocket streaming for market data and trades
- **API Layer**: FastAPI for REST and WebSocket endpoints

## Performance

- **Latency**: <5ms average order processing
- **Throughput**: 1000+ orders/second
- **BBO Updates**: <1ms dissemination latency
- **Trade Streaming**: <1ms dissemination latency

## License

MIT License
