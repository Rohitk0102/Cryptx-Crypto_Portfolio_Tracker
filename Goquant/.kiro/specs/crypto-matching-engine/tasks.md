# Implementation Plan

- [x] 1. Set up project structure and dependencies
  - Create directory structure for core, api, publishers, persistence, utils, and tests modules
  - Create requirements.txt with FastAPI, uvicorn, websockets, sortedcontainers, pydantic, structlog, pytest, and python-decimal
  - Create setup.py for package installation
  - Create .env.example with configuration templates
  - Create .gitignore for Python projects
  - _Requirements: 9.1, 9.2, 11.1_

- [x] 2. Implement core data models and enums
  - Create models.py with OrderType, Side, and OrderStatus enums
  - Implement Order class with validation logic for order types and price requirements
  - Implement Trade class with serialization methods
  - Implement BBO class for best bid/offer representation
  - Implement OrderBookSnapshot class for L2 market data
  - _Requirements: 1.1, 2.1, 9.4, 9.5, 9.6, 9.7, 9.8_

- [x] 3. Implement order book data structure
  - Create PriceLevel class with FIFO queue using deque and total quantity tracking
  - Create OrderBook class with SortedDict for bids (descending) and asks (ascending)
  - Implement add_order method with O(log n) insertion at appropriate price level
  - Implement remove_order method with O(log n) deletion and order index cleanup
  - Implement get_best_bid and get_best_ask methods with O(1) access
  - Implement get_depth method to return top N price levels
  - Implement order_index dictionary for O(1) order lookup by ID
  - _Requirements: 2.3, 2.4, 5.1, 5.2, 5.5, 6.1, 11.3, 11.4_

- [x] 4. Implement matching engine core logic
  - Create MatchingEngine class with order_books dictionary and ID counters
  - Implement process_order method as main entry point for order processing
  - Implement match_order method with price-time priority algorithm iterating through price levels
  - Implement FIFO matching within each price level using deque.popleft
  - Implement trade-through prevention by checking price conditions before matching
  - Implement create_trade helper to generate Trade objects with unique IDs
  - Implement order quantity tracking and order removal when fully filled
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 5.1, 5.2, 5.3, 5.4, 11.5_

- [x] 5. Implement order type handling logic
  - Implement market order processing: match all available liquidity and cancel remainder
  - Implement limit order processing: match at limit price or better, rest remainder on book
  - Implement IOC order processing: match available liquidity immediately, cancel remainder without resting
  - Implement FOK order processing: check if fully fillable first, then execute atomically or cancel entirely
  - Implement can_match helper method to validate price conditions for each order type
  - Implement add_to_book method for resting limit orders on the order book
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_

- [x] 6. Implement BBO calculation and tracking
  - Implement calculate_bbo method to extract best bid and ask from order book
  - Implement BBO caching to avoid redundant calculations
  - Implement BBO update detection when orders are added, matched, or cancelled
  - Implement null handling when order book has no bids or asks
  - _Requirements: 6.1, 6.2, 6.5_

- [x] 7. Implement market data publisher
  - Create MarketDataPublisher class with WebSocketManager dependency
  - Implement publish_bbo_update method to broadcast BBO changes
  - Implement publish_orderbook_update method to broadcast L2 order book snapshots
  - Implement get_orderbook_snapshot method to generate top 10 price levels for bids and asks
  - Implement timestamp generation for all market data messages
  - _Requirements: 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8. Implement trade publisher
  - Create TradePublisher class with WebSocketManager dependency
  - Implement publish_trade method to broadcast trade executions
  - Implement trade message formatting with all required fields
  - Implement aggressor side identification based on taker order
  - _Requirements: 1.4, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 9. Implement WebSocket manager
  - Create WebSocketManager class with connections dictionary mapping symbols to subscriber sets
  - Implement connect method to add new WebSocket subscribers
  - Implement disconnect method to remove subscribers and handle cleanup
  - Implement broadcast method to send messages to all subscribers of a symbol
  - Implement error handling for disconnected clients
  - _Requirements: 6.3, 7.5, 8.2_

- [x] 10. Implement REST API endpoints
  - Create FastAPI application with CORS middleware
  - Implement POST /api/v1/orders endpoint for order submission
  - Implement Pydantic schemas for OrderRequest with validation
  - Implement OrderResponse schema with order_id, status, and timestamp
  - Implement DELETE /api/v1/orders/{order_id} endpoint for order cancellation
  - Implement GET /api/v1/orders/{order_id} endpoint for order status queries
  - Implement GET /api/v1/orderbook/{symbol} endpoint for order book snapshots
  - Implement dependency injection for MatchingEngine instance
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

- [x] 11. Implement WebSocket API endpoints
  - Implement WebSocket endpoint /ws/market-data/{symbol} for BBO and order book subscriptions
  - Implement WebSocket endpoint /ws/trades/{symbol} for trade execution subscriptions
  - Implement connection lifecycle management (connect, subscribe, disconnect)
  - Implement message type routing for "bbo", "orderbook", and "trade" messages
  - Implement initial snapshot sending on connection
  - _Requirements: 6.3, 6.4, 7.2, 7.3, 8.1, 8.2_

- [x] 12. Implement error handling and validation
  - Create custom exception classes: OrderValidationError, InsufficientLiquidityError, OrderNotFoundError
  - Implement input validation for all order parameters in OrderRequest schema
  - Implement HTTP exception handlers for 400, 422, and 500 errors
  - Implement error logging with context information
  - Implement graceful error handling in order processing to prevent system crashes
  - _Requirements: 9.3, 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 13. Implement structured logging
  - Configure structlog with JSON formatting
  - Implement order submission logging with all order details
  - Implement trade execution logging with trade details
  - Implement order cancellation logging with reason
  - Implement error logging with stack traces
  - Implement log rotation configuration
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 14. Implement configuration management
  - Create Settings class using Pydantic BaseSettings
  - Implement environment variable loading from .env file
  - Implement configuration for API host, port, and performance parameters
  - Implement configuration for logging level and format
  - Implement configuration for optional persistence settings
  - _Requirements: 11.1, 11.2_

- [x] 15. Implement application entry point and lifecycle
  - Create main.py with FastAPI app initialization
  - Implement startup event handler to initialize MatchingEngine
  - Implement shutdown event handler for graceful cleanup
  - Implement order processing loop using asyncio.Queue for sequential processing
  - Implement integration of MatchingEngine with MarketDataPublisher and TradePublisher
  - _Requirements: 11.5_

- [x] 16. Wire together all components
  - Integrate MatchingEngine with MarketDataPublisher for BBO updates
  - Integrate MatchingEngine with TradePublisher for trade broadcasts
  - Integrate REST API endpoints with MatchingEngine order processing
  - Integrate WebSocket endpoints with publishers for real-time streaming
  - Implement end-to-end order flow: submission → matching → execution → dissemination
  - _Requirements: 1.4, 1.5, 2.5, 6.2, 6.3, 8.2_

- [x] 17. Implement unit tests for order book
  - Write tests for order insertion at various price levels
  - Write tests for order removal and price level cleanup
  - Write tests for BBO calculation with various book states
  - Write tests for price-time priority enforcement
  - Write tests for edge cases (empty book, single order)
  - _Requirements: 5.1, 5.2, 5.5, 6.1_

- [x] 18. Implement unit tests for matching engine
  - Write tests for market order matching with full and partial liquidity
  - Write tests for limit order matching and resting behavior
  - Write tests for IOC order execution and cancellation
  - Write tests for FOK order atomic execution and rejection
  - Write tests for trade-through prevention
  - Write tests for price-time priority across multiple price levels
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.3, 5.4_

- [x] 19. Implement integration tests for APIs
  - Write tests for order submission through REST API
  - Write tests for WebSocket connection and subscription
  - Write tests for market data streaming accuracy
  - Write tests for trade execution streaming
  - Write tests for error responses and validation
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 20. Implement performance benchmarks
  - Write benchmark for order processing latency (target <5ms average)
  - Write benchmark for BBO update latency (target <1ms)
  - Write benchmark for trade dissemination latency (target <1ms)
  - Write benchmark for sustained order throughput (target 1000+ orders/sec)
  - Write benchmark for WebSocket broadcast performance
  - _Requirements: 11.1, 11.2_

- [x] 21. Create market data simulator for testing
  - Implement MarketDataSimulator class to generate realistic order flow
  - Implement random order generation with configurable parameters
  - Implement order rate control for specified orders per second
  - Implement price distribution around base price with realistic spread
  - Create simulation script for testing and demonstration
  - _Requirements: 11.1_

- [x] 22. Create Docker configuration
  - Create Dockerfile with Python 3.11 base image
  - Create docker-compose.yml for easy deployment
  - Configure uvicorn server with appropriate workers
  - Expose API port 8000
  - _Requirements: 11.1_

- [x] 23. Create documentation
  - Create README.md with project overview, setup instructions, and usage examples
  - Document REST API endpoints with request/response examples
  - Document WebSocket API with message format examples
  - Document configuration options and environment variables
  - Create example client code for order submission and market data consumption
  - _Requirements: 9.1, 9.2_
