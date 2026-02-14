# Quick Start Guide - Transaction & P&L Tracker

## Current Status
✅ API Integration Complete
✅ Frontend Pages Created
✅ Navigation Added
⚠️ Blockchain Service Integration Needed

## Immediate Access

### Step 1: Start the Backend
```bash
cd apps/api
npm run dev
```
The API should start on `http://localhost:5000`

### Step 2: Start the Frontend
```bash
cd apps/web
npm run dev
```
The web app should start on `http://localhost:3000`

### Step 3: Access the New Features

Once logged in, you'll see three tabs at the top of the dashboard:
1. **Portfolio** - Your existing portfolio view
2. **Transactions** - NEW! View all transactions
3. **P&L** - NEW! View profit & loss calculations

Or navigate directly:
- Transactions: `http://localhost:3000/dashboard/transactions`
- P&L: `http://localhost:3000/dashboard/pnl`

## What Works Now

### ✅ Fully Functional
- Transaction API endpoints
- P&L calculation engine
- Cost basis calculator (FIFO, LIFO, Weighted Average)
- Frontend UI for transactions and P&L
- CSV export functionality
- Cost basis method switching

### ⚠️ Needs Configuration
- **Transaction Sync**: Requires blockchain service integration to fetch actual transactions

## Fixing the "Failed to load portfolio" Error

This error is from the existing portfolio functionality, not the new P&L feature. To fix:

1. **Check if API is running**:
```bash
curl http://localhost:5000/health
```

2. **Check if you're logged in**:
   - Make sure you've connected a wallet
   - Check browser console for authentication errors

3. **Check database connection**:
```bash
cd apps/api
npx prisma studio
```

## Testing the New Features

### Test Transaction API (without blockchain service)
You can manually insert test transactions to see the P&L calculations work:

```bash
cd apps/api
npx prisma studio
```

Then add a test transaction in the `PnLTransaction` table:
- userId: (your user ID)
- walletAddress: (your wallet address)
- chain: "ethereum"
- tokenSymbol: "ETH"
- txType: "buy"
- quantity: "1.5"
- priceUsd: "2000"
- timestamp: (current date)
- txHash: "0xtest123"
- source: "wallet"

After adding transactions, refresh the P&L page to see calculations!

### Test P&L Calculation
1. Go to `http://localhost:3000/dashboard/pnl`
2. You should see the P&L summary (will be empty if no transactions)
3. Try changing the cost basis method
4. Click "Export CSV" to test export functionality

## Next Steps to Make It Fully Functional

### Option 1: Quick Mock Data (for testing)
Create a simple mock blockchain service:

```typescript
// apps/api/src/services/blockchain.service.ts
import { RawTransaction } from './transactionSync.service';

export class BlockchainService {
  async getTransactions(walletAddress: string, chain: string): Promise<RawTransaction[]> {
    // Return mock data for testing
    return [
      {
        hash: '0xmock1',
        from: '0xsender',
        to: walletAddress,
        value: '1.5',
        tokenSymbol: 'ETH',
        timestamp: new Date(),
        chain: 'ethereum',
        fee: '0.001',
        feeToken: 'ETH',
      },
      {
        hash: '0xmock2',
        from: walletAddress,
        to: '0xreceiver',
        value: '0.5',
        tokenSymbol: 'ETH',
        timestamp: new Date(),
        chain: 'ethereum',
        fee: '0.001',
        feeToken: 'ETH',
      },
    ];
  }
}
```

Then update `apps/api/src/controllers/sync.controller.ts`:
```typescript
import { BlockchainService } from '../services/blockchain.service';

const blockchainService = new BlockchainService();
const syncService = new TransactionSyncService(
  prisma, 
  priceService, 
  costBasisCalculator,
  blockchainService
);
```

### Option 2: Real Integration (production-ready)
Integrate with a real blockchain data provider:

1. **Etherscan** (Free tier available)
   - Sign up at https://etherscan.io/apis
   - Get API key
   - Use their transaction API

2. **Alchemy** (Recommended)
   - Sign up at https://www.alchemy.com/
   - Get API key
   - Use their enhanced APIs

3. **Moralis** (Easy to use)
   - Sign up at https://moralis.io/
   - Get API key
   - Use their Web3 API

Example with Etherscan:
```typescript
export class BlockchainService {
  private apiKey = process.env.ETHERSCAN_API_KEY;

  async getTransactions(walletAddress: string, chain: string): Promise<RawTransaction[]> {
    const response = await fetch(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${walletAddress}&apikey=${this.apiKey}`
    );
    const data = await response.json();
    
    return data.result.map(tx => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: (parseInt(tx.value) / 1e18).toString(), // Convert from wei
      tokenSymbol: 'ETH',
      timestamp: new Date(parseInt(tx.timeStamp) * 1000),
      chain: 'ethereum',
      fee: ((parseInt(tx.gasUsed) * parseInt(tx.gasPrice)) / 1e18).toString(),
      feeToken: 'ETH',
    }));
  }
}
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5000 (API)
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000 (Web)
lsof -ti:3000 | xargs kill -9
```

### Database Issues
```bash
cd apps/api
npx prisma migrate reset  # WARNING: This will delete all data
npx prisma migrate deploy
npx prisma generate
```

### TypeScript Errors
```bash
cd apps/api
npm run build

cd apps/web
npm run build
```

## API Testing with curl

```bash
# Get your auth token first (from browser localStorage)
TOKEN="your_jwt_token_here"

# Test transactions endpoint
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/transactions?page=1&limit=10"

# Test P&L summary
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:5000/api/pnl/summary"

# Test sync (will fail without blockchain service)
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:5000/api/transactions/sync"
```

## Summary

**What you can do RIGHT NOW:**
1. ✅ View the new UI pages (Transactions & P&L tabs)
2. ✅ Test the API endpoints
3. ✅ Manually add transactions via Prisma Studio to see P&L calculations
4. ✅ Test cost basis method switching
5. ✅ Test CSV export

**What needs setup:**
1. ⚠️ Blockchain service integration for automatic transaction syncing
2. ⚠️ Fix existing portfolio loading error (separate issue)

The P&L calculation engine is fully functional - it just needs transaction data to work with!
