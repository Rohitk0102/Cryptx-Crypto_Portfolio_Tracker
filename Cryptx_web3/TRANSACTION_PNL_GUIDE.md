# Transaction & P&L Tracker - User Guide

## Overview
The Transaction & P&L (Profit & Loss) Tracker has been successfully integrated into your Web3 Portfolio Tracker. This feature allows you to:
- Track all transactions from your connected wallets
- Calculate realized and unrealized profit/loss
- Choose between different cost basis methods (FIFO, LIFO, Weighted Average)
- Export transaction and P&L data to CSV

## How to Access

### 1. Navigation Tabs
Once you're logged into the dashboard, you'll see three tabs at the top:
- **Portfolio** - Your main portfolio view (existing functionality)
- **Transactions** - View all your transaction history
- **P&L** - View your profit and loss calculations

### 2. Direct URLs
You can also access the pages directly:
- Transactions: `http://localhost:3000/dashboard/transactions`
- P&L Dashboard: `http://localhost:3000/dashboard/pnl`

## Features

### Transaction History Page (`/dashboard/transactions`)

**Features:**
- Paginated transaction list (20 per page)
- Filter by:
  - Token symbol (e.g., ETH, USDC)
  - Transaction type (buy, sell, swap, transfer, fee)
- Sort by:
  - Date (newest/oldest first)
  - Price
  - Quantity
- Export to CSV button
- Shows: Date, Token, Type, Quantity, Price, Total Value, Chain

**How to Use:**
1. Navigate to the Transactions tab
2. Use the filter dropdowns to narrow down transactions
3. Click column headers to sort
4. Click "Export CSV" to download transaction data

### P&L Dashboard Page (`/dashboard/pnl`)

**Features:**
- Summary cards showing:
  - Total Realized P&L (from closed positions)
  - Total Unrealized P&L (from current holdings)
  - Combined Total P&L
- Cost basis method selector (FIFO, LIFO, Weighted Average)
- Token-wise breakdown table showing:
  - Current holdings
  - Cost basis
  - Current value
  - Unrealized P&L
  - Realized P&L
  - Total P&L
  - Percentage gain/loss
- Sync button to refresh transaction data
- Export to CSV button

**How to Use:**
1. Navigate to the P&L tab
2. Click "Sync Transactions" to fetch latest data from your wallets
3. Select your preferred cost basis method from the dropdown
4. View your P&L breakdown by token
5. Click "Export CSV" to download P&L report

## API Endpoints

The following API endpoints are now available:

### Transaction Endpoints
- `GET /api/transactions` - Get paginated transactions with filters
  - Query params: page, limit, startDate, endDate, tokenSymbol, txType, walletAddress, sortBy, sortOrder
- `POST /api/transactions/sync` - Sync transactions from wallets
  - Body: `{ walletAddresses?: string[] }` (optional filter)
- `GET /api/transactions/sync/status` - Get current sync status

### P&L Endpoints
- `GET /api/pnl/realized` - Get realized P&L
  - Query params: startDate, endDate, tokenSymbol
- `GET /api/pnl/unrealized` - Get unrealized P&L
  - Query params: tokenSymbol
- `GET /api/pnl/summary` - Get complete P&L summary
  - Query params: startDate, endDate, tokenSymbol
- `PATCH /api/pnl/cost-basis-method` - Update cost basis method
  - Body: `{ method: "FIFO" | "LIFO" | "WEIGHTED_AVERAGE" }`

## Cost Basis Methods Explained

### FIFO (First In, First Out)
- Default method
- Sells the earliest purchased tokens first
- Common for tax reporting in many jurisdictions

### LIFO (Last In, First Out)
- Sells the most recently purchased tokens first
- Can be beneficial in rising markets

### Weighted Average
- Uses the average purchase price across all holdings
- Simplifies calculations for frequent traders

## Troubleshooting

### "Failed to load portfolio" Error
This error appears when:
1. The API server is not running
2. Database connection issues
3. No wallets connected yet

**Solutions:**
1. Make sure the API server is running: `npm run dev` in `apps/api`
2. Check database connection in `.env` file
3. Connect at least one wallet first

### No Transactions Showing
**Possible causes:**
1. No wallets connected
2. Transactions not synced yet
3. Blockchain service not configured

**Solutions:**
1. Connect a wallet from the Portfolio tab
2. Click "Sync Transactions" on the P&L page
3. Ensure blockchain service is properly configured

### Sync Not Working
**Requirements:**
- Blockchain service must be configured to fetch transactions
- Currently, the sync service needs a blockchain service implementation
- You may need to integrate with services like Etherscan, Alchemy, or Moralis

## Starting the Application

### Backend (API)
```bash
cd apps/api
npm run dev
```
The API will run on `http://localhost:5000`

### Frontend (Web)
```bash
cd apps/web
npm run dev
```
The web app will run on `http://localhost:3000`

### Database
Make sure PostgreSQL is running and migrations are applied:
```bash
cd apps/api
npx prisma migrate deploy
```

## Next Steps

### To Make Transactions Work:
1. **Integrate Blockchain Service**: The `TransactionSyncService` needs a blockchain service to fetch actual transactions. You can integrate:
   - Etherscan API
   - Alchemy
   - Moralis
   - QuickNode
   - Or any other blockchain data provider

2. **Example Integration** (in `apps/api/src/services/blockchain.service.ts`):
```typescript
import { RawTransaction } from './transactionSync.service';

export class BlockchainService {
  async getTransactions(walletAddress: string, chain: string): Promise<RawTransaction[]> {
    // Fetch from Etherscan, Alchemy, etc.
    const response = await fetch(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${walletAddress}`
    );
    const data = await response.json();
    
    // Transform to RawTransaction format
    return data.result.map(tx => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      tokenSymbol: 'ETH',
      timestamp: new Date(tx.timeStamp * 1000),
      chain: 'ethereum',
      fee: tx.gasUsed * tx.gasPrice,
      feeToken: 'ETH',
    }));
  }
}
```

3. **Update Sync Controller** to use the blockchain service:
```typescript
import { BlockchainService } from '../services/blockchain.service';

const blockchainService = new BlockchainService();
const syncService = new TransactionSyncService(
  prisma, 
  priceService, 
  costBasisCalculator,
  blockchainService  // Pass the blockchain service
);
```

## Testing the API

You can test the API endpoints using curl or Postman:

```bash
# Get transactions
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/transactions?page=1&limit=20"

# Get P&L summary
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/pnl/summary"

# Sync transactions
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  "http://localhost:5000/api/transactions/sync"
```

## Database Schema

The following tables were added:
- `PnLTransaction` - Stores all transactions
- `Holding` - Stores current holdings with cost basis
- `RealizedPnL` - Stores realized P&L records

User table was extended with:
- `costBasisMethod` - User's preferred cost basis method (default: FIFO)

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check the API server logs
3. Verify database migrations are applied
4. Ensure all environment variables are set correctly
