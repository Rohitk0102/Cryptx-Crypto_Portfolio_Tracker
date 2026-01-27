# Design Document

## Overview

The Crypto Portfolio Tracker is a React-based web application that leverages Wagmi for seamless wallet connectivity (MetaMask and WalletConnect), integrates with blockchain networks for real-time portfolio data, and utilizes AI model APIs for intelligent portfolio analysis. The application follows a modular architecture with clear separation of concerns between wallet management, blockchain data fetching, AI analysis, and UI presentation.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              UI Layer - React PWA + Tailwind CSS             │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Wallet     │  │  Portfolio   │  │  AI Analysis │     │
│  │  Connection  │  │   Dashboard  │  │   Dashboard  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│              Wagmi Layer - Web3 Integration                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Ethereum    │  │   Polygon    │  │     BSC      │     │
│  │   Mainnet    │  │              │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│            Backend Layer - Node.js/Express API               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Portfolio   │  │ Transaction  │  │   Price      │     │
│  │   Service    │  │   Service    │  │   Service    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│          AI Layer - Python (Flask/FastAPI)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  LSTM Price  │  │  MPT Portfolio│ │  Risk        │     │
│  │  Forecasting │  │  Optimization │  │  Analysis    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│                Database Layer - MongoDB                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   User       │  │  Portfolio   │  │  AI Model    │     │
│  │  Preferences │  │   History    │  │   Cache      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
├─────────────────────────────────────────────────────────────┤
│                    External Services                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Blockchain  │  │  Price API   │  │  Historical  │     │
│  │   RPC Nodes  │  │ (CoinGecko)  │  │  Market Data │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**UI Layer:**
- **Frontend Framework**: React 18+ with TypeScript
- **PWA**: Service Workers for offline capability
- **Wallet Integration**: Wagmi v2 + Viem
- **Wallet Connectors**: MetaMask, WalletConnect v2
- **State Management**: Zustand for global state
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **Charts**: Recharts for data visualization
- **Build Tool**: Vite

**Backend Layer:**
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **API Documentation**: Swagger/OpenAPI
- **Authentication**: JWT tokens
- **Rate Limiting**: express-rate-limit
- **Validation**: Zod
- **HTTP Client**: Axios

**AI Layer:**
- **Runtime**: Python 3.10+
- **Framework**: FastAPI or Flask
- **ML Libraries**: TensorFlow/Keras for LSTM, PyPortfolioOpt for MPT
- **Data Processing**: NumPy, Pandas
- **Model Serving**: TensorFlow Serving or custom REST API

**Database Layer:**
- **Database**: MongoDB 6+
- **ODM**: Mongoose (Node.js)
- **Caching**: Redis for session and API response caching

**Blockchain Integration:**
- **Chains**: Ethereum, Polygon, BSC
- **RPC Providers**: Alchemy, Infura
- **Price Data**: CoinGecko API, CoinMarketCap API

## Components and Interfaces

### 1. Wallet Connection Module

#### WagmiProvider Configuration
```typescript
interface WagmiConfig {
  chains: Chain[];
  connectors: Connector[];
  publicClient: PublicClient;
  autoConnect: boolean;
}
```

**Supported Chains:**
- Ethereum Mainnet
- Polygon
- Binance Smart Chain

**Connectors:**
- MetaMask (InjectedConnector)
- WalletConnect (WalletConnectConnector)

#### WalletConnect Component
```typescript
interface WalletConnectProps {
  onConnect: (address: string, chainId: number) => void;
  onDisconnect: () => void;
  onError: (error: Error) => void;
}
```

**Key Features:**
- Display available wallet options
- Handle connection flow with loading states
- Persist connection using localStorage
- Display connected address with ENS resolution
- Provide disconnect functionality

### 2. Portfolio Dashboard Module

#### PortfolioDashboard Component
```typescript
interface PortfolioDashboardProps {
  address: string;
  chainId: number;
}

interface PortfolioData {
  totalValue: number;
  tokens: TokenBalance[];
  priceChanges: PriceChange[];
  lastUpdated: Date;
}

interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  decimals: number;
  usdValue: number;
  percentage: number;
  logo: string;
  contractAddress: string;
}
```

**Key Features:**
- Display total portfolio value in USD
- Show token breakdown with percentages
- Visualize allocation with pie/donut chart
- Display 24h price changes
- Auto-refresh every 60 seconds
- Support chain switching

### 3. Transaction History Module

#### TransactionHistory Component
```typescript
interface TransactionHistoryProps {
  address: string;
  chainId: number;
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  token: string;
  timestamp: number;
  status: 'success' | 'pending' | 'failed';
  gasUsed: string;
  blockNumber: number;
}
```

**Key Features:**
- Fetch transactions from blockchain
- Display paginated transaction list
- Show transaction details (amount, token, time)
- Link to block explorer
- Filter by transaction type
- Search by transaction hash

### 4. AI Analysis Module

#### Backend API Endpoints (Node.js/Express)
```typescript
// Portfolio Analysis Endpoints
POST /api/ai/analyze-diversification
POST /api/ai/forecast-prices
POST /api/ai/analyze-risk
GET /api/ai/analysis-history/:address
```

#### Python AI Service (FastAPI)

**LSTM Price Forecasting Service**
```python
class LSTMPriceForecastService:
    def __init__(self, model_path: str, lookback_period: int = 60):
        self.model = load_model(model_path)
        self.lookback_period = lookback_period
    
    def forecast_price(self, token: str, days: int) -> PriceForecast:
        # Fetch historical price data
        # Preprocess data (normalization, windowing)
        # Generate predictions using LSTM model
        # Calculate confidence intervals
        # Return forecast with confidence score
        pass
```

**MPT Portfolio Optimization Service**
```python
from pypfopt import EfficientFrontier, risk_models, expected_returns

class MPTOptimizationService:
    def optimize_portfolio(self, portfolio_data: dict) -> DiversificationAnalysis:
        # Calculate expected returns and covariance matrix
        # Run efficient frontier optimization
        # Generate recommended allocation
        # Identify overconcentrated positions
        # Calculate risk metrics
        pass
```

**Risk Analysis Service**
```python
class RiskAnalysisService:
    def analyze_risk(self, portfolio_data: dict) -> RiskAnalysis:
        # Calculate portfolio volatility
        # Assess concentration risk (Herfindahl index)
        # Evaluate liquidity risk
        # Compute Value at Risk (VaR)
        # Generate risk score and recommendations
        pass
```

#### Frontend AI Service Interface
```typescript
interface AIAnalysisService {
  analyzeDiversification(portfolio: PortfolioData): Promise<DiversificationAnalysis>;
  forecastPrices(tokens: string[]): Promise<PriceForecast[]>;
  analyzeRisk(portfolio: PortfolioData): Promise<RiskAnalysis>;
}

interface DiversificationAnalysis {
  currentAllocation: AllocationBreakdown;
  recommendedAllocation: AllocationBreakdown;
  overconcentratedAssets: string[];
  recommendations: string[];
  riskScore: number;
  sharpeRatio: number;
  expectedReturn: number;
  expectedVolatility: number;
}

interface PriceForecast {
  token: string;
  currentPrice: number;
  forecast7d: number;
  forecast30d: number;
  confidence: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  predictionInterval: {
    lower: number;
    upper: number;
  };
}

interface RiskAnalysis {
  overallRiskScore: number;
  concentrationRisk: number;
  volatilityRisk: number;
  liquidityRisk: number;
  valueAtRisk: number;
  highRiskAssets: string[];
  recommendations: string[];
}
```

**AI Model Integration Strategy:**
- Python AI services run as separate microservices
- Node.js backend acts as API gateway
- Implement retry logic with exponential backoff
- Cache AI responses in MongoDB for 24 hours
- Use Redis for real-time caching
- Provide fallback for AI service failures
- Rate limit AI API calls
- Queue long-running AI tasks

### 5. Blockchain Service Module

#### BlockchainService
```typescript
interface BlockchainService {
  getTokenBalances(address: string, chainId: number): Promise<TokenBalance[]>;
  getTransactions(address: string, chainId: number, page: number): Promise<Transaction[]>;
  getTokenPrice(tokenAddress: string): Promise<number>;
  switchChain(chainId: number): Promise<void>;
}
```

**Implementation Details:**
- Use Wagmi hooks (useBalance, useContractRead)
- Integrate with Alchemy/Infura for enhanced APIs
- Implement token list from trusted sources
- Handle multi-chain queries efficiently
- Cache blockchain data appropriately

## Data Models

### Frontend State (Zustand)
```typescript
interface PortfolioState {
  address: string | null;
  chainId: number | null;
  isConnected: boolean;
  portfolioData: PortfolioData | null;
  transactions: Transaction[];
  aiAnalysis: {
    diversification: DiversificationAnalysis | null;
    forecasts: PriceForecast[];
    risk: RiskAnalysis | null;
  };
  loading: {
    portfolio: boolean;
    transactions: boolean;
    aiAnalysis: boolean;
  };
  errors: {
    portfolio: Error | null;
    transactions: Error | null;
    aiAnalysis: Error | null;
  };
}
```

### MongoDB Schemas

**User Preferences Schema**
```javascript
const UserPreferencesSchema = new Schema({
  walletAddress: { type: String, required: true, unique: true, index: true },
  preferredChain: { type: Number, default: 1 },
  theme: { type: String, enum: ['light', 'dark'], default: 'dark' },
  currency: { type: String, default: 'USD' },
  notifications: {
    priceAlerts: { type: Boolean, default: false },
    portfolioUpdates: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

**Portfolio History Schema**
```javascript
const PortfolioHistorySchema = new Schema({
  walletAddress: { type: String, required: true, index: true },
  chainId: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  totalValue: { type: Number, required: true },
  tokens: [{
    symbol: String,
    balance: String,
    usdValue: Number,
    percentage: Number
  }],
  snapshot: { type: Boolean, default: false }
});
```

**AI Analysis Cache Schema**
```javascript
const AIAnalysisCacheSchema = new Schema({
  walletAddress: { type: String, required: true, index: true },
  analysisType: { 
    type: String, 
    enum: ['diversification', 'forecast', 'risk'], 
    required: true 
  },
  input: { type: Schema.Types.Mixed, required: true },
  result: { type: Schema.Types.Mixed, required: true },
  confidence: { type: Number },
  createdAt: { type: Date, default: Date.now, expires: 86400 } // 24h TTL
});
```

**Price History Schema**
```javascript
const PriceHistorySchema = new Schema({
  tokenSymbol: { type: String, required: true, index: true },
  tokenAddress: { type: String, required: true },
  chainId: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  price: { type: Number, required: true },
  volume24h: { type: Number },
  marketCap: { type: Number },
  priceChange24h: { type: Number }
});
```

### Backend API Models

**Request/Response DTOs**
```typescript
// Portfolio Analysis Request
interface AnalyzeDiversificationRequest {
  walletAddress: string;
  chainId: number;
  portfolioData: PortfolioData;
}

// Price Forecast Request
interface ForecastPricesRequest {
  tokens: string[];
  forecastDays: number[];
}

// Risk Analysis Request
interface AnalyzeRiskRequest {
  walletAddress: string;
  portfolioData: PortfolioData;
}
```

### Configuration
```typescript
interface AppConfig {
  supportedChains: Chain[];
  rpcProviders: Record<number, string>;
  priceApiUrl: string;
  backendApiUrl: string;
  aiServiceUrl: string;
  refreshInterval: number;
  transactionsPerPage: number;
}

interface BackendConfig {
  port: number;
  mongoUri: string;
  redisUri: string;
  aiServiceUrl: string;
  jwtSecret: string;
  corsOrigins: string[];
  rateLimits: {
    windowMs: number;
    maxRequests: number;
  };
}

interface AIServiceConfig {
  port: number;
  modelPaths: {
    lstm: string;
    mpt: string;
  };
  dataSourceUrl: string;
  cacheTTL: number;
}
```

## Error Handling

### Error Types
```typescript
enum ErrorType {
  WALLET_CONNECTION_REJECTED = 'WALLET_CONNECTION_REJECTED',
  WALLET_NOT_FOUND = 'WALLET_NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNSUPPORTED_CHAIN = 'UNSUPPORTED_CHAIN',
  BLOCKCHAIN_FETCH_ERROR = 'BLOCKCHAIN_FETCH_ERROR',
  PRICE_API_ERROR = 'PRICE_API_ERROR',
  AI_API_ERROR = 'AI_API_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
}

interface AppError {
  type: ErrorType;
  message: string;
  details?: any;
  retryable: boolean;
}
```

### Error Handling Strategy
1. **Wallet Errors**: Display user-friendly messages with action buttons
2. **Network Errors**: Implement automatic retry with exponential backoff
3. **API Errors**: Show error toast with manual retry option
4. **Timeout Errors**: Display timeout message after 10 seconds
5. **Unsupported Chain**: Prompt user to switch to supported chain
6. **Logging**: Log all errors to console in development, use error tracking service in production

## Testing Strategy

### Unit Tests
- Test individual components in isolation
- Mock Wagmi hooks and external services
- Test error handling scenarios
- Test data transformation functions
- Target: 80% code coverage

### Integration Tests
- Test wallet connection flow
- Test portfolio data fetching and display
- Test transaction history pagination
- Test AI analysis integration
- Test chain switching functionality

### E2E Tests
- Test complete user journey from connection to analysis
- Test on multiple browsers (Chrome, Firefox, Safari)
- Test responsive design on different screen sizes
- Test with actual wallet connections (testnet)

### Testing Tools
- **Unit/Integration**: Vitest + React Testing Library
- **E2E**: Playwright
- **Mocking**: MSW (Mock Service Worker)

## Performance Considerations

### Optimization Strategies
1. **Code Splitting**: Lazy load AI analysis components
2. **Caching**: 
   - Cache token prices for 30 seconds
   - Cache AI analysis for 24 hours
   - Cache transaction history for 5 minutes
3. **Debouncing**: Debounce price updates and user inputs
4. **Pagination**: Implement virtual scrolling for large transaction lists
5. **Image Optimization**: Use optimized token logos with lazy loading
6. **Bundle Size**: Keep initial bundle under 200KB (gzipped)

### Performance Targets
- Initial page load: < 2 seconds
- Time to interactive: < 3 seconds
- Wallet connection: < 2 seconds
- Portfolio data fetch: < 3 seconds
- AI analysis: < 5 seconds

## Security Considerations

### Best Practices
1. **Never store private keys**: All wallet operations through Wagmi
2. **Client-side only**: No server-side storage of wallet data
3. **HTTPS only**: Enforce secure connections
4. **API key protection**: Store AI API keys in environment variables
5. **Input validation**: Validate all user inputs and blockchain data
6. **XSS prevention**: Sanitize all displayed data
7. **CSP headers**: Implement Content Security Policy
8. **Rate limiting**: Limit API calls to prevent abuse

## Deployment Strategy

### Environment Setup

**Development Environment:**
- Frontend: Local Vite dev server (localhost:5173)
- Backend: Local Node.js server (localhost:3000)
- AI Service: Local Python server (localhost:8000)
- Database: Local MongoDB instance or MongoDB Atlas
- Redis: Local Redis instance
- Blockchain: Testnet (Goerli, Mumbai, BSC Testnet)

**Staging Environment:**
- Frontend: Vercel/Netlify
- Backend: Railway/Render/DigitalOcean
- AI Service: Railway/Render with GPU support
- Database: MongoDB Atlas (Shared cluster)
- Redis: Redis Cloud (Free tier)
- Blockchain: Testnet

**Production Environment:**
- Frontend: Vercel/Netlify with CDN
- Backend: Railway/Render/DigitalOcean (Load balanced)
- AI Service: Railway/Render with GPU support (Auto-scaling)
- Database: MongoDB Atlas (Dedicated cluster)
- Redis: Redis Cloud (Production tier)
- Blockchain: Mainnet

### Environment Variables

**Frontend (.env)**
```bash
VITE_WALLETCONNECT_PROJECT_ID=xxx
VITE_ALCHEMY_API_KEY=xxx
VITE_BACKEND_API_URL=http://localhost:3000
VITE_ENABLE_PWA=true
```

**Backend (.env)**
```bash
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/crypto-tracker
REDIS_URI=redis://localhost:6379
AI_SERVICE_URL=http://localhost:8000
JWT_SECRET=xxx
CORS_ORIGINS=http://localhost:5173
ALCHEMY_API_KEY=xxx
COINGECKO_API_KEY=xxx
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**AI Service (.env)**
```bash
PORT=8000
LSTM_MODEL_PATH=./models/lstm_price_forecast.h5
MPT_MODEL_PATH=./models/mpt_optimizer.pkl
DATA_SOURCE_URL=https://api.coingecko.com/api/v3
CACHE_TTL=86400
LOG_LEVEL=INFO
```

### CI/CD Pipeline

**Frontend Pipeline (GitHub Actions)**
```yaml
1. Checkout code
2. Install dependencies (npm ci)
3. Run linting (eslint)
4. Run type checking (tsc)
5. Run unit tests (vitest)
6. Build production bundle (vite build)
7. Deploy to Vercel/Netlify
8. Run E2E tests (Playwright)
```

**Backend Pipeline (GitHub Actions)**
```yaml
1. Checkout code
2. Install dependencies (npm ci)
3. Run linting (eslint)
4. Run type checking (tsc)
5. Run unit tests (jest)
6. Run integration tests
7. Build Docker image
8. Push to container registry
9. Deploy to Railway/Render
10. Run health checks
```

**AI Service Pipeline (GitHub Actions)**
```yaml
1. Checkout code
2. Set up Python environment
3. Install dependencies (pip install -r requirements.txt)
4. Run linting (flake8, black)
5. Run type checking (mypy)
6. Run unit tests (pytest)
7. Build Docker image
8. Push to container registry
9. Deploy to Railway/Render
10. Run model validation tests
```

### Docker Configuration

**Backend Dockerfile**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

**AI Service Dockerfile**
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Monitoring and Logging

**Frontend:**
- Error tracking: Sentry
- Analytics: Google Analytics / Plausible
- Performance: Vercel Analytics

**Backend:**
- Logging: Winston + MongoDB
- Error tracking: Sentry
- APM: New Relic / DataDog
- Uptime monitoring: UptimeRobot

**AI Service:**
- Logging: Python logging + File rotation
- Model performance: MLflow
- Error tracking: Sentry

**Database:**
- MongoDB Atlas monitoring
- Redis monitoring dashboard

## Accessibility

### WCAG 2.1 AA Compliance
- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Color contrast ratios > 4.5:1
- Screen reader compatibility
- Focus indicators for all interactive elements
- Alt text for all images

## Responsive Design Breakpoints

```css
/* Mobile */
@media (min-width: 320px) { }

/* Tablet */
@media (min-width: 768px) { }

/* Desktop */
@media (min-width: 1024px) { }

/* Large Desktop */
@media (min-width: 1440px) { }
```

## Future Enhancements

1. **Multi-wallet support**: Connect multiple wallets simultaneously
2. **NFT tracking**: Display NFT portfolio alongside tokens
3. **DeFi positions**: Track staking, lending, and LP positions
4. **Tax reporting**: Generate tax reports for transactions
5. **Alerts**: Set price alerts and portfolio notifications
6. **Social features**: Share portfolio performance (anonymously)
7. **Advanced AI**: Sentiment analysis, news aggregation
8. **Mobile app**: React Native version for iOS/Android
