# Technology Stack

## Frontend

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Wallet Integration**: Wagmi v2 + Viem (MetaMask, WalletConnect v2)
- **State Management**: Zustand
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **Charts**: Recharts
- **PWA**: Service Workers for offline capability

## Backend

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Validation**: Zod
- **Authentication**: JWT tokens
- **Rate Limiting**: express-rate-limit
- **HTTP Client**: Axios

## AI Service

- **Runtime**: Python 3.10+
- **Framework**: FastAPI or Flask
- **ML Libraries**: 
  - TensorFlow/Keras for LSTM price forecasting
  - PyPortfolioOpt for Modern Portfolio Theory optimization
  - NumPy, Pandas for data processing

## Data Layer

- **Database**: MongoDB 6+ with Mongoose ODM
- **Caching**: Redis (30s for prices, 24h for AI analysis, 5min for transactions)

## Blockchain Integration

- **Supported Chains**: Ethereum, Polygon, Binance Smart Chain
- **RPC Providers**: Alchemy, Infura
- **Price Data**: CoinGecko API, CoinMarketCap API

## Development Tools

- **Testing**: Vitest + React Testing Library (unit/integration), Playwright (E2E)
- **Linting**: ESLint
- **Type Checking**: TypeScript compiler

## Common Commands

### Frontend Development
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run unit tests
npm run test:e2e     # Run E2E tests
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
```

### Backend Development
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:3000)
npm run build        # Build TypeScript
npm start            # Start production server
npm test             # Run tests
npm run lint         # Run ESLint
```

### AI Service Development
```bash
pip install -r requirements.txt  # Install dependencies
uvicorn main:app --reload        # Start dev server (localhost:8000)
pytest                           # Run tests
flake8 .                         # Run linter
black .                          # Format code
mypy .                           # Type checking
```

## Environment Variables

### Frontend (.env)
- `VITE_WALLETCONNECT_PROJECT_ID`: WalletConnect project ID
- `VITE_ALCHEMY_API_KEY`: Alchemy API key for blockchain data
- `VITE_BACKEND_API_URL`: Backend API URL
- `VITE_ENABLE_PWA`: Enable PWA features

### Backend (.env)
- `PORT`: Server port (default: 3000)
- `MONGODB_URI`: MongoDB connection string
- `REDIS_URI`: Redis connection string
- `AI_SERVICE_URL`: Python AI service URL
- `JWT_SECRET`: Secret for JWT token generation
- `ALCHEMY_API_KEY`: Alchemy API key
- `COINGECKO_API_KEY`: CoinGecko API key

### AI Service (.env)
- `PORT`: Server port (default: 8000)
- `LSTM_MODEL_PATH`: Path to LSTM model file
- `MPT_MODEL_PATH`: Path to MPT model file
- `DATA_SOURCE_URL`: Historical data API URL
