# Crypto Portfolio Tracker

A full-stack cryptocurrency portfolio tracking application with AI-powered analytics, built using a 3-layer architecture.

## Architecture Overview

This project follows a **3-layer architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│              Layer 1: Frontend (React PWA)                   │
│  - React 18+ with TypeScript                                 │
│  - Wagmi for wallet integration (MetaMask, WalletConnect)   │
│  - Tailwind CSS for styling                                  │
│  - Zustand for state management                              │
│  - Communicates with Backend via REST API                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│           Layer 2: Backend (Node.js/Express)                 │
│  - Express.js REST API                                       │
│  - JWT authentication                                        │
│  - Business logic and data orchestration                     │
│  - Communicates with Database (MongoDB)                      │
│  - Communicates with AI Service (Python)                     │
│  - Integrates with blockchain RPC providers                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│    Layer 3: Data & AI Services                               │
│                                                               │
│  Database (MongoDB):                                         │
│  - User preferences                                          │
│  - Portfolio history                                         │
│  - AI analysis cache                                         │
│  - Price history                                             │
│                                                               │
│  AI Service (Python/FastAPI):                                │
│  - LSTM price forecasting                                    │
│  - MPT portfolio optimization                                │
│  - Risk analysis                                             │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
crypto-portfolio-tracker/
├── frontend/                 # Layer 1: React PWA
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API clients
│   │   ├── store/           # Zustand state management
│   │   ├── config/          # Wagmi configuration
│   │   └── types/           # TypeScript types
│   └── package.json
│
├── backend/                  # Layer 2: Node.js API
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── models/          # MongoDB schemas
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   └── utils/           # Utility functions
│   └── package.json
│
└── ai-service/               # Layer 3: Python AI Service
    ├── models/              # Trained ML models
    ├── services/            # AI implementations
    ├── utils/               # Data processing
    ├── main.py              # FastAPI application
    └── requirements.txt
```

## Layer Responsibilities

### Layer 1: Frontend
- **Purpose**: User interface and wallet integration
- **Responsibilities**:
  - Wallet connection (MetaMask, WalletConnect)
  - Display portfolio data
  - Visualize AI analytics
  - Handle user interactions
- **Communication**: REST API calls to Backend
- **Port**: 5173 (development)

### Layer 2: Backend
- **Purpose**: Business logic and API orchestration
- **Responsibilities**:
  - Authenticate users
  - Fetch blockchain data
  - Aggregate portfolio information
  - Cache data in MongoDB
  - Proxy requests to AI service
  - Rate limiting and validation
- **Communication**: 
  - Receives HTTP requests from Frontend
  - Queries MongoDB
  - Calls AI Service APIs
  - Calls blockchain RPC providers
- **Port**: 3000

### Layer 3: Data & AI Services
- **MongoDB Purpose**: Data persistence
- **Responsibilities**:
  - Store user preferences
  - Cache portfolio snapshots
  - Store AI analysis results
  - Store historical price data
- **Port**: 27017 (default)

- **AI Service Purpose**: Machine learning analytics
- **Responsibilities**:
  - Price forecasting (LSTM)
  - Portfolio optimization (MPT)
  - Risk analysis
- **Port**: 8000

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB 6+
- npm or yarn

### Installation

#### 1. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev
```

#### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

#### 3. AI Service Setup
```bash
cd ai-service
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
uvicorn main:app --reload
```

#### 4. Database Setup
```bash
# Install MongoDB locally or use MongoDB Atlas
# Update MONGODB_URI in backend/.env
```

## Environment Variables

### Frontend (.env)
```
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
VITE_ALCHEMY_API_KEY=your_alchemy_key
VITE_BACKEND_API_URL=http://localhost:3000
```

### Backend (.env)
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/crypto-tracker
REDIS_URI=redis://localhost:6379
AI_SERVICE_URL=http://localhost:8000
JWT_SECRET=your_secret_key
ALCHEMY_API_KEY=your_alchemy_key
```

### AI Service (.env)
```
PORT=8000
LSTM_MODEL_PATH=./models/lstm_price_forecast.h5
MPT_MODEL_PATH=./models/mpt_optimizer.pkl
```

## Development Workflow

1. **Start MongoDB** (if running locally)
2. **Start AI Service**: `cd ai-service && uvicorn main:app --reload`
3. **Start Backend**: `cd backend && npm run dev`
4. **Start Frontend**: `cd frontend && npm run dev`

## API Flow Example

```
User Action (Frontend)
    ↓
Connect Wallet (Wagmi)
    ↓
GET /api/portfolio/:address (Backend)
    ↓
├─→ Fetch from Blockchain (Alchemy/Infura)
├─→ Query MongoDB (cached data)
└─→ POST /api/ai/analyze (AI Service)
    ↓
Return aggregated data to Frontend
    ↓
Display in UI
```

## Key Features

- ✅ **Multi-chain support**: Ethereum, Polygon, BSC
- ✅ **Wallet integration**: MetaMask, WalletConnect
- ✅ **Real-time portfolio tracking**
- ✅ **AI-powered analytics**:
  - Price forecasting (LSTM)
  - Portfolio diversification (MPT)
  - Risk analysis
- ✅ **Responsive design**: Mobile, tablet, desktop
- ✅ **Progressive Web App**: Offline capability
- ✅ **Decentralized**: No private key storage

## Technology Stack

### Frontend
- React 18+ with TypeScript
- Wagmi v2 + Viem
- Tailwind CSS
- Zustand
- Recharts

### Backend
- Node.js 18+
- Express.js
- MongoDB + Mongoose
- Redis
- Axios

### AI Service
- Python 3.10+
- FastAPI
- TensorFlow/Keras (LSTM)
- PyPortfolioOpt (MPT)
- NumPy, Pandas

## License

MIT
