# CryptX Web3 Portfolio Tracker

Centralized crypto portfolio tracking application with Web3 wallet authentication.

## 🏗️ Architecture

- **Frontend**: Next.js 15 + TypeScript + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Redis
- **Web3**: Direct ethers.js v6 + WalletConnect v2
- **Auth**: Sign-In with Ethereum (SIWE)

## 📁 Project Structure

```
Cryptx_web3/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Express backend
├── package.json      # Root workspace config
└── README.md
```

## 🚀 Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL (Cloud recommended: Supabase, Neon, Railway)
- Redis (Cloud recommended: Upstash, Redis Cloud)
- MetaMask browser extension

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install workspace dependencies
npm run install:all
```

### 2. Configure Backend

1. Navigate to `apps/api`
2. Copy `.env` and update values:

```bash
# Database (Get from your cloud provider)
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Redis (Get from Upstash or similar)
REDIS_URL="redis://default:password@host:6379"

# JWT Secrets (Generate secure random strings)
JWT_SECRET="your-32-char-secret"
REFRESH_TOKEN_SECRET="your-32-char-refresh-secret"

# Encryption (MUST be exactly 32 characters)
ENCRYPTION_KEY="your-exactly-32-character-key!"

# Blockchain RPC URLs (Get free keys from Alchemy/Infura)
ETH_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/YOUR-KEY"
POLYGON_RPC_URL="https://polygon-mainnet.g.alchemy.com/v2/YOUR-KEY"
BSC_RPC_URL="https://bsc-dataseed.binance.org/"
```

3. Run Prisma migrations:

```bash
cd apps/api
npx prisma migrate dev --name init
npx prisma generate
```

### 3. Configure Frontend

1. Navigate to `apps/web`
2. Update `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

Get WalletConnect Project ID from: https://cloud.walletconnect.com

### 4. Start Development

```bash
# From root directory
npm run dev
```

This starts:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 🔐 Authentication Flow

1. User clicks "Connect Wallet"
2. MetaMask prompts for connection
3. Backend generates nonce
4. User signs SIWE message
5. Backend verifies signature
6. JWT tokens issued
7. Session managed centrally

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:web          # Start only frontend
npm run dev:api          # Start only backend

# Build
npm run build            # Build all workspaces

# Database
cd apps/api
npm run prisma:studio    # Open Prisma Studio
npm run prisma:migrate   # Run migrations
```

## 📊 Database Schema

- **User**: Main user record (linked to wallet address)
- **Session**: JWT refresh tokens
- **Wallet**: Connected wallets (on-chain)
- **ExchangeConnection**: CEX API credentials (encrypted)
- **PortfolioSnapshot**: Cached portfolio data
- **PriceCache**: Token price cache

## 🔒 Security Features

✅ Non-custodial (no private keys stored)  
✅ SIWE for authentication  
✅ AES-256-GCM encryption for API keys  
✅ JWT with refresh tokens  
✅ Nonce replay attack prevention  
✅ CORS protection  

## 🌐 Supported Chains

- Ethereum (ETH)
- Polygon (MATIC)
- Binance Smart Chain (BSC)

## 📝 Next Steps

1. ✅ Setup project structure
2. ✅ Implement SIWE authentication
3. ⏳ Add wallet balance fetching
4. ⏳ Integrate CoinDCX API
5. ⏳ Build portfolio aggregation
6. ⏳ Create dashboard UI
7. ⏳ Implement background sync

## 🤝 Contributing

This is a production-grade architecture following Web3 best practices.

## 📄 License

MIT
