# CryptX Setup Guide

## Prerequisites Checklist

Before starting, ensure you have:

- ✅ Node.js 18+ installed
- ✅ npm or yarn
- ✅ MetaMask browser extension
- ✅ Access to create cloud database accounts

---

## Step 1: Clone & Install

```bash
cd /Users/rohit/Coding/Cryptx_web3

# Install root dependencies
npm install

# This will also install workspaces
```

---

## Step 2: Setup Cloud PostgreSQL

### Option A: Supabase (Recommended)

1. Go to https://supabase.com
2. Create account / Sign in
3. Click "New Project"
4. Fill details:
   - **Name**: cryptx-db
   - **Database Password**: (save this!)
   - **Region**: Choose closest to you
5. Wait for provisioning (~2 min)
6. Go to **Settings** → **Database**
7. Copy **Connection String** (URI format)
8. Replace `[YOUR-PASSWORD]` with your actual password

Example:
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

### Option B: Neon

1. Go to https://neon.tech
2. Sign up with GitHub
3. Create project: **cryptx-db**
4. Copy connection string from dashboard

---

## Step 3: Setup Cloud Redis

### Using Upstash (Free Tier)

1. Go to https://upstash.com
2. Sign up
3. Click **Create Database**
   - **Name**: cryptx-cache
   - **Type**: Regional
   - **Region**: Choose closest
4. Click **Connect** button
5. Copy **Redis URL**

Format:
```
redis://default:[PASSWORD]@[HOST]:[PORT]
```

---

## Step 4: Get Blockchain RPC Keys

### Using Alchemy (Free)

1. Go to https://alchemy.com
2. Sign up
3. Create apps for each chain:

**Ethereum App:**
- Click **Create App**
- Name: CryptX-Ethereum
- Chain: Ethereum
- Network: Mainnet
- Copy API Key

**Polygon App:**
- Create App
- Name: CryptX-Polygon
- Chain: Polygon PoS
- Network: Mainnet
- Copy API Key

Your URLs will be:
```
ETH: https://eth-mainnet.g.alchemy.com/v2/YOUR-API-KEY
POLYGON: https://polygon-mainnet.g.alchemy.com/v2/YOUR-API-KEY
```

For BSC, use public RPC:
```
https://bsc-dataseed.binance.org/
```

---

## Step 5: Configure Backend `.env`

Navigate to backend:
```bash
cd apps/api
```

Edit `.env` file with your actual values:

```bash
# Server
PORT=5000
NODE_ENV=development

# Database - PASTE YOUR SUPABASE/NEON URL HERE
DATABASE_URL="your-postgresql-url-here"

# Redis - PASTE YOUR UPSTASH URL HERE
REDIS_URL="your-redis-url-here"

# JWT Secrets - GENERATE SECURE RANDOM STRINGS
JWT_SECRET="change-this-to-random-32-char-string"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="change-this-to-different-32-char"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Encryption - MUST BE EXACTLY 32 CHARACTERS
ENCRYPTION_KEY="your-exactly-32-character-key!"

# Blockchain RPC URLs - PASTE YOUR ALCHEMY KEYS
ETH_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/YOUR-KEY"
POLYGON_RPC_URL="https://polygon-mainnet.g.alchemy.com/v2/YOUR-KEY"
BSC_RPC_URL="https://bsc-dataseed.binance.org/"

# Price API (CoinGecko is free, key optional)
COINGECKO_API_KEY=""

# CORS
FRONTEND_URL="http://localhost:3000"
```

### Generate Secure Secrets

For JWT secrets and encryption key, use:

```bash
# On Mac/Linux:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Run this 3 times to get 3 different keys
```

---

## Step 6: Run Database Migrations

Still in `apps/api`:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

You should see tables created in Supabase:
- User
- Session
- Wallet
- ExchangeConnection
- PortfolioSnapshot
- PriceCache

---

## Step 7: Configure Frontend `.env`

Navigate to frontend:
```bash
cd ../web
```

Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your-walletconnect-id
```

### Get WalletConnect Project ID

1. Go to https://cloud.walletconnect.com
2. Sign in with GitHub
3. Create New Project
4. Name: CryptX
5. Copy **Project ID**
6. Paste in `.env.local`

---

## Step 8: Start Development Servers

From **root directory**:

```bash
cd /Users/rohit/Coding/Cryptx_web3

# Start both frontend and backend
npm run dev
```

This will start:
- ✅ Backend API: http://localhost:5000
- ✅ Frontend: http://localhost:3000

---

## Step 9: Test the Application

1. Open http://localhost:3000
2. Click "Connect Wallet"
3. MetaMask will popup - click "Connect"
4. Sign the message in MetaMask
5. You'll be redirected to dashboard
6. Your wallet balance should load

---

## Troubleshooting

### Error: "Prisma Client Not Generated"
```bash
cd apps/api
npx prisma generate
```

### Error: "Redis Connection Failed"
- Check `REDIS_URL` is correct
- Ensure Upstash database is active
- Try pinging: `redis-cli -u YOUR_REDIS_URL ping`

### Error: "Database Connection Failed"
- Verify `DATABASE_URL` is correct
- Check password doesn't have special chars that need encoding
- Ensure Supabase project is running

### Error: "MetaMask Not Detected"
- Install MetaMask extension
- Refresh page
- Check browser console for errors

### Frontend Can't Reach Backend
- Ensure backend is running on port 5000
- Check CORS settings in `apps/api/src/index.ts`
- Verify `NEXT_PUBLIC_API_URL` in frontend `.env.local`

### No Wallet Balances Showing
- Check Alchemy API keys are valid
- Ensure wallet has some assets
- Check browser console for RPC errors
- Verify chain is supported (ETH/Polygon/BSC)

---

## API Endpoints Reference

### Authentication
- `POST /api/auth/nonce` - Get nonce
- `POST /api/auth/verify` - Verify signature
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Wallets
- `GET /api/wallets` - List wallets
- `POST /api/wallets` - Add wallet
- `DELETE /api/wallets/:id` - Remove wallet
- `GET /api/wallets/:id/balances` - Get balances

### Portfolio
- `GET /api/portfolio` - Get portfolio
- `POST /api/portfolio/refresh` - Refresh data
- `GET /api/portfolio/history` - Get snapshots

---

## Next Steps

After successful setup:

1. **Add More Wallets**
   - Support multiple wallet addresses
   - Track different accounts

2. **Exchange Integration**
   - Add CoinDCX API support
   - Implement secure key storage

3. **Background Sync**
   - Setup BullMQ workers
   - Auto-refresh every 5-15 mins

4. **UI Enhancements**
   - Add charts (Recharts)
   - Mobile responsiveness
   - Dark mode toggle

5. **Production Deployment**
   - Deploy frontend to Vercel
   - Deploy backend to Railway/Render
   - Update CORS origins

---

## Security Checklist

Before going to production:

- [ ] Change all default secrets
- [ ] Use environment-specific configs
- [ ] Enable HTTPS only
- [ ] Setup proper CORS
- [ ] Rate limit APIs
- [ ] Add input validation
- [ ] Setup logging/monitoring
- [ ] Regular security audits

---

## Support

If you encounter issues:
1. Check `.env` files are configured
2. Ensure all services (DB, Redis) are running
3. Check browser console for errors
4. Review backend logs
5. Verify MetaMask is unlocked

**Congratulations! Your CryptX Portfolio Tracker is now running! 🎉**
