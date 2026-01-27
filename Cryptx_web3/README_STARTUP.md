# 🚀 CryptX Startup Guide

## Quick Start

The `start.sh` script provides an easy way to run the complete CryptX Web3 Portfolio Tracker including frontend, backend, and database services.

## Prerequisites

Before running the startup script, ensure you have:

1. **Node.js 18+** installed
2. **PostgreSQL** installed and running
3. **Redis** installed and running
4. **Environment files** configured:
   - `apps/api/.env` (copy from `apps/api/.env.example`)
   - `apps/web/.env.local` (copy from `apps/web/.env.example`)

## Usage

### Basic Commands

```bash
# Start all services (default command)
./start.sh

# Or explicitly
./start.sh start

# Stop all services
./start.sh stop

# Restart all services
./start.sh restart

# Check service status
./start.sh status

# View logs
./start.sh logs

# Setup dependencies and database
./start.sh setup

# Check prerequisites
./start.sh check

# Stop services and cleanup
./start.sh cleanup

# Show help
./start.sh help
```

## What the Script Does

### 📋 **Prerequisites Check**
- Verifies Node.js and npm installation
- Checks for PostgreSQL and Redis clients
- Validates environment file existence

### 📦 **Dependencies Installation**
- Installs root workspace dependencies
- Installs backend dependencies
- Installs frontend dependencies

### 🗄️ **Database Setup**
- Generates Prisma client
- Runs database migrations
- Sets up database schema

### 🚀 **Service Management**
- Starts backend on port 5000
- Starts frontend on port 3000
- Manages process IDs for cleanup
- Handles port conflicts

### 📊 **Monitoring**
- Health checks for all services
- Log management
- Service status reporting

## Service URLs

Once started, you can access:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/health
- **Rate Limit Stats**: http://localhost:5000/admin/rate-limits

## Log Files

Logs are stored in the `logs/` directory:
- `logs/backend.log` - Backend server logs
- `logs/frontend.log` - Frontend development server logs
- `logs/backend.pid` - Backend process ID
- `logs/frontend.pid` - Frontend process ID

## Development Workflow

### First Time Setup
```bash
# 1. Clone and navigate to project
cd /Users/rohit/Coding/Cryptx_web3

# 2. Configure environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3. Edit environment files with your configuration
# (Database URLs, API keys, etc.)

# 4. Run complete setup
./start.sh setup
```

### Daily Development
```bash
# Start all services
./start.sh

# In another terminal, view logs
./start.sh logs

# When done, stop services
./start.sh stop
```

### Troubleshooting

#### Port Conflicts
If you encounter port conflicts:
```bash
# Stop services and cleanup
./start.sh cleanup

# Restart
./start.sh start
```

#### Database Issues
```bash
# Re-run database setup
./start.sh setup
```

#### Dependency Issues
```bash
# Reinstall dependencies
./start.sh setup
```

## Environment Configuration

### Backend (.env)
```bash
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/cryptx"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secrets
JWT_SECRET="your-32-char-secret"
REFRESH_TOKEN_SECRET="your-32-char-refresh-secret"

# Encryption
ENCRYPTION_KEY="your-exactly-32-character-key!"

# Blockchain RPC URLs
ETH_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/YOUR-KEY"
POLYGON_RPC_URL="https://polygon-mainnet.g.alchemy.com/v2/YOUR-KEY"
BSC_RPC_URL="https://bsc-dataseed.binance.org/"

# Price API
COINGECKO_API_KEY="your-coingecko-key"
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-id
```

## Features Included

✅ **Auto-detection** of wallet providers (MetaMask/WalletConnect)  
✅ **Multi-chain** support (Ethereum, Polygon, BSC)  
✅ **Token discovery** with multiple API sources  
✅ **Price feeds** with fallback providers  
✅ **Rate limiting** for API protection  
✅ **Error handling** with retry logic  
✅ **Health monitoring** and logging  
✅ **Hot reload** for development  

## Production Deployment

For production deployment, modify the environment variables:
- Set `NODE_ENV=production`
- Use production database URLs
- Configure production Redis
- Update CORS origins
- Use HTTPS URLs

## Support

If you encounter issues:

1. Check the logs: `./start.sh logs`
2. Verify environment configuration
3. Ensure all prerequisites are installed
4. Check service status: `./start.sh status`

## Security Notes

- Never commit `.env` files to version control
- Use strong, unique secrets for production
- Regularly update dependencies
- Monitor logs for suspicious activity
