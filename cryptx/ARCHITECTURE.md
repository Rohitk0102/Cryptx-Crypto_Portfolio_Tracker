# Architecture Documentation

## 3-Layer Architecture Overview

This project implements a strict 3-layer architecture with clear separation of concerns and well-defined communication patterns.

## Layer Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 1: FRONTEND                             │
│                   (React PWA + Wagmi)                            │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Wallet     │  │  Portfolio   │  │  AI Analysis │          │
│  │  Connection  │  │   Dashboard  │  │   Dashboard  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  Technology: React 18, TypeScript, Wagmi, Tailwind CSS          │
│  Port: 5173 (dev) / 80 (prod)                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                         HTTP REST API
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 2: BACKEND                              │
│                  (Node.js + Express)                             │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Portfolio   │  │ Transaction  │  │  AI Client   │          │
│  │   Service    │  │   Service    │  │   Service    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  Technology: Node.js 18, Express, TypeScript, Mongoose          │
│  Port: 3000                                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
┌──────────────────────────┐  ┌──────────────────────────┐
│   LAYER 3: DATABASE      │  │   LAYER 3: AI SERVICE    │
│      (MongoDB)           │  │   (Python + FastAPI)     │
│                          │  │                          │
│  ┌────────────────────┐ │  │  ┌────────────────────┐ │
│  │ User Preferences   │ │  │  │ LSTM Forecasting   │ │
│  │ Portfolio History  │ │  │  │ MPT Optimization   │ │
│  │ AI Cache           │ │  │  │ Risk Analysis      │ │
│  │ Price History      │ │  │  └────────────────────┘ │
│  └────────────────────┘ │  │                          │
│                          │  │  Technology: Python 3.10 │
│  Technology: MongoDB 6   │  │  FastAPI, TensorFlow     │
│  Port: 27017             │  │  Port: 8000              │
└──────────────────────────┘  └──────────────────────────┘
```

## Communication Flow

### 1. User Connects Wallet
```
User → Frontend (Wagmi) → MetaMask/WalletConnect
                ↓
        Wallet Connected
                ↓
Frontend → Backend: GET /api/portfolio/:address
                ↓
Backend → Blockchain RPC (Alchemy)
Backend → MongoDB (check cache)
                ↓
Backend → Frontend: Portfolio Data
                ↓
        Display in UI
```

### 2. AI Analysis Request
```
User → Frontend: Request AI Analysis
                ↓
Frontend → Backend: POST /api/ai/analyze-diversification
                ↓
Backend → MongoDB (check cache)
                ↓ (if not cached)
Backend → AI Service: POST /api/analyze-diversification
                ↓
AI Service → Process with MPT Model
                ↓
AI Service → Backend: Analysis Results
                ↓
Backend → MongoDB (cache results)
                ↓
Backend → Frontend: Analysis Results
                ↓
        Display in UI
```

## Layer Responsibilities

### Layer 1: Frontend (React PWA)

**Purpose**: User interface and wallet integration

**Responsibilities**:
- Wallet connection (MetaMask, WalletConnect)
- Display portfolio data and charts
- Visualize AI analytics
- Handle user interactions
- Client-side state management
- PWA offline capability

**Does NOT**:
- Store sensitive data
- Perform business logic
- Direct blockchain queries
- AI computations

**Communication**:
- Outbound: HTTP REST API to Backend
- Inbound: User interactions, Wallet events

### Layer 2: Backend (Node.js/Express)

**Purpose**: Business logic orchestration and API gateway

**Responsibilities**:
- Authenticate requests (JWT)
- Validate input data
- Fetch blockchain data (via Alchemy/Infura)
- Aggregate portfolio information
- Cache data in MongoDB
- Proxy requests to AI service
- Rate limiting
- Error handling
- Logging

**Does NOT**:
- Render UI
- Store private keys
- Perform AI computations
- Direct wallet interactions

**Communication**:
- Inbound: HTTP REST API from Frontend
- Outbound: 
  - MongoDB queries
  - AI Service HTTP calls
  - Blockchain RPC calls
  - External APIs (CoinGecko)

### Layer 3a: Database (MongoDB)

**Purpose**: Data persistence and caching

**Responsibilities**:
- Store user preferences
- Cache portfolio snapshots
- Store AI analysis results (24h TTL)
- Store historical price data
- Provide fast data retrieval

**Does NOT**:
- Perform business logic
- Validate data (done in Backend)
- Expose direct API

**Communication**:
- Inbound: Queries from Backend only
- Outbound: None

### Layer 3b: AI Service (Python/FastAPI)

**Purpose**: Machine learning analytics

**Responsibilities**:
- Price forecasting (LSTM neural networks)
- Portfolio optimization (Modern Portfolio Theory)
- Risk analysis (statistical models)
- Model inference
- Data preprocessing

**Does NOT**:
- Store data permanently
- Authenticate users
- Fetch blockchain data
- Render UI

**Communication**:
- Inbound: HTTP REST API from Backend only
- Outbound: External data APIs (for training data)

## Data Flow Patterns

### Pattern 1: Real-time Portfolio Data
```
Frontend → Backend → [Blockchain RPC, MongoDB Cache] → Backend → Frontend
```

### Pattern 2: AI Analysis
```
Frontend → Backend → [MongoDB Cache Check] → AI Service → Backend → MongoDB → Frontend
```

### Pattern 3: Transaction History
```
Frontend → Backend → [Blockchain RPC, MongoDB Cache] → Backend → Frontend
```

## Security Boundaries

### Frontend Security
- No private keys stored
- Client-side encryption for cached data
- HTTPS only
- CSP headers
- XSS prevention

### Backend Security
- JWT authentication
- Input validation (Zod)
- Rate limiting
- CORS configuration
- SQL injection prevention (Mongoose)
- API key protection

### Database Security
- No direct external access
- Backend-only access
- Encrypted connections
- Regular backups

### AI Service Security
- Backend-only access
- Input validation (Pydantic)
- No sensitive data storage
- Rate limiting

## Scalability Considerations

### Frontend
- CDN for static assets
- Code splitting
- Lazy loading
- Service worker caching

### Backend
- Horizontal scaling (multiple instances)
- Redis for session management
- MongoDB connection pooling
- API response caching

### AI Service
- GPU acceleration for models
- Request queuing
- Model caching
- Async processing

### Database
- MongoDB sharding
- Read replicas
- Indexes on frequently queried fields
- TTL indexes for cache cleanup

## Development vs Production

### Development
- All layers run locally
- Hot reload enabled
- Detailed logging
- No authentication required (optional)
- Mock data available

### Production
- Layers deployed separately
- Frontend: Vercel/Netlify
- Backend: Railway/Render
- AI Service: Railway/Render (GPU)
- Database: MongoDB Atlas
- Redis: Redis Cloud

## Monitoring

### Frontend
- Sentry (error tracking)
- Google Analytics (usage)
- Vercel Analytics (performance)

### Backend
- Winston (logging)
- Sentry (error tracking)
- New Relic (APM)

### AI Service
- Python logging
- MLflow (model performance)
- Sentry (error tracking)

### Database
- MongoDB Atlas monitoring
- Redis monitoring dashboard

## Testing Strategy

### Frontend
- Unit tests: Vitest
- Component tests: React Testing Library
- E2E tests: Playwright

### Backend
- Unit tests: Jest
- Integration tests: Supertest
- API tests: Postman/Newman

### AI Service
- Unit tests: pytest
- Model tests: TensorFlow testing
- Integration tests: pytest

## Deployment

### CI/CD Pipeline
```
Git Push → GitHub Actions
    ↓
Run Tests (all layers)
    ↓
Build (all layers)
    ↓
Deploy Frontend → Vercel
Deploy Backend → Railway
Deploy AI Service → Railway
    ↓
Run E2E Tests
    ↓
Production Live
```

## Layer Independence

Each layer can be:
- Developed independently
- Tested independently
- Deployed independently
- Scaled independently
- Replaced independently (with same interface)

This ensures:
- Maintainability
- Flexibility
- Scalability
- Team collaboration
