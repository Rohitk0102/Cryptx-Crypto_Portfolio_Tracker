# Fixing the "Failed to load portfolio" Error

## Understanding the Error

The error you're seeing in the screenshot is **NOT** related to the new Transaction & P&L features. It's from the existing portfolio functionality.

```
⚠️ Failed to load portfolio
```

This error appears on the main Portfolio tab, not on the new Transactions or P&L tabs.

## Why This Happens

The portfolio loading can fail for several reasons:

1. **API Server Not Running**
   - The backend API at `http://localhost:5000` is not responding

2. **Database Connection Issue**
   - PostgreSQL is not running
   - Database credentials are incorrect

3. **No Wallets Connected**
   - You haven't connected any wallets yet
   - The portfolio has no data to display

4. **Authentication Issue**
   - JWT token expired
   - Not properly logged in

## Quick Fixes

### Fix 1: Check if API is Running

```bash
# Check if API is responding
curl http://localhost:5000/health

# Expected response:
# {"status":"ok","timestamp":"...","version":"1.0.0","services":{"database":"healthy","redis":"unavailable"}}
```

If this fails, start the API:
```bash
cd apps/api
npm run dev
```

### Fix 2: Check Database Connection

```bash
# Test database connection
cd apps/api
npx prisma studio
```

If Prisma Studio opens, your database is working. If not:

```bash
# Check if PostgreSQL is running
# On Mac:
brew services list | grep postgresql

# On Linux:
sudo systemctl status postgresql

# Start PostgreSQL if needed:
# Mac:
brew services start postgresql

# Linux:
sudo systemctl start postgresql
```

### Fix 3: Check Environment Variables

Make sure `apps/api/.env` has correct database URL:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/cryptx_db"
```

### Fix 4: Connect a Wallet

The portfolio needs at least one wallet to display data:

1. Click "Add Wallet" button
2. Connect your wallet (MetaMask, Coinbase, etc.)
3. Wait for the connection to complete
4. Refresh the page

### Fix 5: Check Browser Console

Open browser DevTools (F12) and check the Console tab for errors:

```javascript
// Common errors you might see:

// 1. Network error
"Failed to fetch"
→ API server is not running

// 2. 401 Unauthorized
"Unauthorized"
→ Not logged in or token expired

// 3. 500 Internal Server Error
"Internal server error"
→ Check API server logs
```

## Testing the New Features (Bypassing the Error)

**Good news:** The new Transaction & P&L features work independently!

Even if the portfolio page shows an error, you can still:

1. **Navigate directly to Transactions:**
   ```
   http://localhost:3000/dashboard/transactions
   ```

2. **Navigate directly to P&L:**
   ```
   http://localhost:3000/dashboard/pnl
   ```

These pages use different API endpoints and will work even if the portfolio endpoint is failing.

## Complete Diagnostic Checklist

Run through this checklist:

### ✅ Backend Health
```bash
# 1. Check API server
curl http://localhost:5000/health

# 2. Check if port 5000 is in use
lsof -i :5000

# 3. Check API logs
cd apps/api
npm run dev
# Look for any error messages
```

### ✅ Database Health
```bash
# 1. Test Prisma connection
cd apps/api
npx prisma studio

# 2. Check migrations
npx prisma migrate status

# 3. Apply migrations if needed
npx prisma migrate deploy
```

### ✅ Frontend Health
```bash
# 1. Check web server
curl http://localhost:3000

# 2. Check if port 3000 is in use
lsof -i :3000

# 3. Check web logs
cd apps/web
npm run dev
# Look for any error messages
```

### ✅ Authentication
```bash
# 1. Check if you're logged in
# Open browser console and run:
localStorage.getItem('auth-storage')

# Should show something like:
# {"state":{"isAuthenticated":true,"user":{...},"token":"..."}}

# If null or isAuthenticated is false, you need to log in again
```

## Step-by-Step Recovery

If everything is broken, follow these steps:

### Step 1: Clean Start
```bash
# Kill all processes
lsof -ti:5000 | xargs kill -9
lsof -ti:3000 | xargs kill -9

# Start PostgreSQL
brew services start postgresql  # Mac
# or
sudo systemctl start postgresql  # Linux
```

### Step 2: Reset Database (if needed)
```bash
cd apps/api

# WARNING: This deletes all data!
npx prisma migrate reset

# Or just apply migrations:
npx prisma migrate deploy
npx prisma generate
```

### Step 3: Start Backend
```bash
cd apps/api
npm install  # Make sure dependencies are installed
npm run dev

# Wait for:
# ✅ Database connected
# 🚀 Server running on http://localhost:5000
```

### Step 4: Start Frontend
```bash
cd apps/web
npm install  # Make sure dependencies are installed
npm run dev

# Wait for:
# ✓ Ready in Xms
# ○ Local: http://localhost:3000
```

### Step 5: Login Again
1. Open `http://localhost:3000`
2. Connect your wallet
3. Complete authentication
4. Navigate to dashboard

## Accessing New Features Without Fixing Portfolio

If you just want to see the new Transaction & P&L features:

### Option 1: Add Test Data
```bash
cd apps/api
npx prisma studio
```

1. Open the `User` table
2. Copy your user ID
3. Open the `PnLTransaction` table
4. Click "Add record"
5. Fill in:
   - userId: (paste your user ID)
   - walletAddress: "0xtest"
   - chain: "ethereum"
   - tokenSymbol: "ETH"
   - txType: "buy"
   - quantity: "1.5"
   - priceUsd: "2000"
   - timestamp: (today's date)
   - txHash: "0xtest123"
   - source: "wallet"
6. Save

Now navigate to:
- `http://localhost:3000/dashboard/transactions`
- `http://localhost:3000/dashboard/pnl`

You'll see your test transaction and P&L calculations!

### Option 2: Test API Directly
```bash
# Get your JWT token from browser localStorage
# Then test the new endpoints:

TOKEN="your_jwt_token_here"

# Test transactions endpoint
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/transactions"

# Test P&L endpoint
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/pnl/summary"
```

## Common Error Messages Explained

### "Failed to load portfolio"
- **Cause:** Portfolio API endpoint failing
- **Impact:** Only affects Portfolio tab
- **Solution:** Check API server and database
- **Workaround:** Use Transactions and P&L tabs directly

### "No Portfolio Data"
- **Cause:** No wallets connected
- **Impact:** Portfolio shows empty state
- **Solution:** Connect a wallet
- **Workaround:** Add test data via Prisma Studio

### "Unauthorized"
- **Cause:** Not logged in or token expired
- **Impact:** All API calls fail
- **Solution:** Log in again
- **Workaround:** None - must authenticate

### "Network Error"
- **Cause:** API server not running
- **Impact:** All API calls fail
- **Solution:** Start API server
- **Workaround:** None - must start server

## Summary

**The Error You're Seeing:**
- ❌ Portfolio loading failed (existing feature)
- ✅ New Transaction & P&L features are independent

**Quick Test:**
1. Make sure API is running: `cd apps/api && npm run dev`
2. Make sure Web is running: `cd apps/web && npm run dev`
3. Navigate to: `http://localhost:3000/dashboard/transactions`
4. Navigate to: `http://localhost:3000/dashboard/pnl`

**The new features work even if portfolio is broken!**

You can explore the Transaction and P&L pages right now, even with the portfolio error showing.
