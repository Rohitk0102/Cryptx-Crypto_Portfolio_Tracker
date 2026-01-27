# Project Structure

## Architecture Pattern

Three-tier architecture with separate frontend, backend, and AI service layers:

```
Frontend (React/Vite) → Backend (Node.js/Express) → AI Service (Python/FastAPI)
                     ↓                           ↓
              Blockchain Networks          MongoDB + Redis
```

## Folder Organization

### Frontend Structure
```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── wallet/         # Wallet connection components
│   │   ├── portfolio/      # Portfolio dashboard components
│   │   ├── transactions/   # Transaction history components
│   │   ├── ai/            # AI analysis components
│   │   └── ui/            # shadcn/ui components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API clients and blockchain services
│   ├── store/              # Zustand state management
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   ├── config/             # Configuration (chains, connectors)
│   └── App.tsx             # Main application component
├── public/                 # Static assets
└── vite.config.ts          # Vite configuration
```

### Backend Structure
```
backend/
├── src/
│   ├── controllers/        # Request handlers
│   ├── services/           # Business logic
│   │   ├── portfolio.ts   # Portfolio data service
│   │   ├── transaction.ts # Transaction service
│   │   ├── price.ts       # Price fetching service
│   │   └── ai-client.ts   # AI service client
│   ├── models/             # MongoDB schemas
│   ├── middleware/         # Express middleware
│   ├── routes/             # API route definitions
│   ├── types/              # TypeScript types
│   ├── utils/              # Utility functions
│   └── server.ts           # Express server setup
└── package.json
```

### AI Service Structure
```
ai-service/
├── models/                 # Trained ML models
│   ├── lstm_price_forecast.h5
│   └── mpt_optimizer.pkl
├── services/               # AI service implementations
│   ├── lstm_forecast.py   # LSTM price forecasting
│   ├── mpt_optimizer.py   # Portfolio optimization
│   └── risk_analysis.py   # Risk analysis
├── utils/                  # Data processing utilities
├── main.py                 # FastAPI application
└── requirements.txt
```

## Key Conventions

### Component Organization
- One component per file
- Co-locate component-specific styles and tests
- Use named exports for components
- Keep components focused and single-purpose

### Service Layer
- Separate blockchain data fetching from business logic
- Use service classes for complex operations
- Implement error handling at service level
- Cache responses appropriately (30s for prices, 24h for AI)

### State Management
- Use Zustand for global state (wallet, portfolio, AI analysis)
- Keep component-local state in React hooks when appropriate
- Separate loading and error states for each data domain

### API Structure
- RESTful endpoints with clear resource naming
- Consistent error response format
- Request validation with Zod
- Rate limiting on all endpoints

### Database Models
- Separate schemas for user preferences, portfolio history, AI cache, and price history
- Use indexes on frequently queried fields (walletAddress, timestamp)
- Implement TTL for cache collections (24h for AI analysis)

### Naming Conventions
- Components: PascalCase (e.g., `PortfolioDashboard`)
- Files: kebab-case (e.g., `portfolio-dashboard.tsx`)
- Functions/variables: camelCase (e.g., `fetchPortfolioData`)
- Constants: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- Types/Interfaces: PascalCase (e.g., `PortfolioData`)

### Error Handling
- Use typed error objects with error codes
- Display user-friendly messages in UI
- Log detailed errors to console/monitoring service
- Implement retry logic for transient failures

### Testing Organization
- Unit tests co-located with source files (`.test.ts`)
- Integration tests in `tests/integration/`
- E2E tests in `tests/e2e/`
- Mock external services (blockchain, APIs) in tests

## Layer Separation Rules

- **UI Layer**: Only presentation logic, no direct blockchain or API calls
- **Service Layer**: Business logic, data transformation, external API integration
- **Data Layer**: Database operations, caching, data persistence
- **Never mix**: Keep wallet logic separate from portfolio logic separate from AI logic
