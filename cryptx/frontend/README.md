# Crypto Portfolio Tracker - Frontend

A React-based Progressive Web App for tracking cryptocurrency portfolios across multiple blockchain networks with AI-powered analytics.

## Tech Stack

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Wallet Integration**: Wagmi v2 + Viem
- **State Management**: Zustand
- **UI Framework**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **PWA**: vite-plugin-pwa

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your API keys:
# - VITE_WALLETCONNECT_PROJECT_ID (from https://cloud.walletconnect.com/)
# - VITE_ALCHEMY_API_KEY (from https://www.alchemy.com/)
```

### Development

```bash
# Start development server
npm run dev

# Run tests
npm run test

# Run linting
npm run lint

# Type checking
npm run type-check
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── wallet/         # Wallet connection components
│   ├── portfolio/      # Portfolio dashboard components
│   ├── transactions/   # Transaction history components
│   ├── ai/            # AI analysis components
│   └── ui/            # shadcn/ui components
├── hooks/              # Custom React hooks
├── services/           # API clients and blockchain services
├── store/              # Zustand state management
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── config/             # Configuration (chains, connectors)
└── App.tsx             # Main application component
```

## Environment Variables

- `VITE_WALLETCONNECT_PROJECT_ID`: WalletConnect project ID for wallet connections
- `VITE_ALCHEMY_API_KEY`: Alchemy API key for blockchain data
- `VITE_BACKEND_API_URL`: Backend API URL (default: http://localhost:3000)
- `VITE_ENABLE_PWA`: Enable PWA features (default: true)

## Features

- ✅ Wallet connection (MetaMask, WalletConnect)
- ✅ Multi-chain support (Ethereum, Polygon, BSC)
- ✅ Real-time portfolio tracking
- ✅ Transaction history
- ✅ AI-powered analytics (diversification, forecasting, risk analysis)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Progressive Web App (offline capability)

## License

MIT
