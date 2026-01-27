# Backend API - Crypto Portfolio Tracker

Node.js/Express backend API for the Crypto Portfolio Tracker application.

## Architecture Layer

This is **Layer 2** of the 3-layer architecture:
- Receives requests from Frontend (Layer 1)
- Queries MongoDB database (Layer 3)
- Calls AI Service (Layer 3)
- Integrates with blockchain RPC providers

## Tech Stack

- Node.js 18+
- Express.js
- TypeScript
- MongoDB + Mongoose
- Redis (caching)
- Axios (HTTP client)
- Zod (validation)

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   │   ├── portfolio.ts    # Portfolio data service
│   │   ├── transaction.ts  # Transaction service
│   │   ├── price.ts        # Price fetching service
│   │   └── ai-client.ts    # AI service client
│   ├── models/          # MongoDB schemas
│   ├── middleware/      # Express middleware
│   ├── routes/          # API route definitions
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── server.ts        # Express server setup
└── package.json
```

## Installation

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required environment variables:
- `MONGODB_URI`: MongoDB connection string
- `REDIS_URI`: Redis connection string
- `AI_SERVICE_URL`: Python AI service URL
- `ALCHEMY_API_KEY`: Alchemy API key for blockchain data
- `JWT_SECRET`: Secret for JWT token generation

## Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run type-check
```

## API Endpoints

### Portfolio
- `GET /api/portfolio/:address` - Get portfolio data
- `GET /api/portfolio/:address/history` - Get portfolio history

### Transactions
- `GET /api/transactions/:address` - Get transaction history

### AI Analysis
- `POST /api/ai/analyze-diversification` - Get diversification analysis
- `POST /api/ai/forecast-prices` - Get price forecasts
- `POST /api/ai/analyze-risk` - Get risk analysis

### Health
- `GET /health` - Health check endpoint

## Layer Communication

```
Frontend (Layer 1)
    ↓ HTTP REST API
Backend (Layer 2) ← You are here
    ↓
├─→ MongoDB (Layer 3)
├─→ AI Service (Layer 3)
└─→ Blockchain RPC
```

## Development Guidelines

- Follow the service layer pattern
- Keep controllers thin (request/response handling only)
- Put business logic in services
- Use TypeScript for type safety
- Validate all inputs with Zod
- Cache responses appropriately
- Handle errors gracefully
- Log important events

## Port

Default: `3000`
