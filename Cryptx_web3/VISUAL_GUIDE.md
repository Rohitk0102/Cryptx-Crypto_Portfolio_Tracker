# Visual Guide - How to Access Transaction & P&L Features

## 🎯 Where to Find the New Features

### Step 1: Login to Dashboard
Navigate to: `http://localhost:3000/dashboard`

### Step 2: Look for Navigation Tabs
At the top of the dashboard, you'll now see **THREE TABS**:

```
┌─────────────────────────────────────────────────────────┐
│  Portfolio  │  Transactions  │  P&L                     │
│  ─────────                                               │
└─────────────────────────────────────────────────────────┘
```

- **Portfolio** (existing) - Your current portfolio view
- **Transactions** (NEW!) - View all your transactions
- **P&L** (NEW!) - View profit & loss calculations

### Step 3: Click on "Transactions" Tab

You'll see:
```
┌─────────────────────────────────────────────────────────┐
│  Transaction History                    [Export CSV]    │
├─────────────────────────────────────────────────────────┤
│  Filters:                                                │
│  Token: [____]  Type: [All Types ▼]  Sort: [Date ▼]    │
├─────────────────────────────────────────────────────────┤
│  Date          Token  Type  Quantity  Price    Total    │
│  ────────────────────────────────────────────────────   │
│  (Your transactions will appear here)                    │
└─────────────────────────────────────────────────────────┘
```

### Step 4: Click on "P&L" Tab

You'll see:
```
┌─────────────────────────────────────────────────────────┐
│  Profit & Loss          [Sync] [Export CSV]             │
├─────────────────────────────────────────────────────────┤
│  Cost Basis Method: [FIFO ▼]                            │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ Realized    │  │ Unrealized  │  │ Total P&L   │    │
│  │ $0.00       │  │ $0.00       │  │ $0.00       │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
├─────────────────────────────────────────────────────────┤
│  Token-wise Breakdown                                    │
│  Token  Holdings  Cost  Value  Unrealized  Realized     │
│  ────────────────────────────────────────────────────   │
│  (Your P&L breakdown will appear here)                   │
└─────────────────────────────────────────────────────────┘
```

## 🔧 Current State

### ✅ What's Working
- Navigation tabs are visible
- Pages are accessible
- UI is fully functional
- API endpoints are ready
- Export functionality works

### ⚠️ What Needs Data
The pages will show "No data" messages because:
1. No transactions have been synced yet
2. Blockchain service needs to be configured

## 🚀 Quick Test

### Option A: Add Test Data Manually
1. Open Prisma Studio:
   ```bash
   cd apps/api
   npx prisma studio
   ```

2. Go to `PnLTransaction` table

3. Click "Add record" and fill in:
   - userId: (copy from User table)
   - walletAddress: (your wallet address)
   - chain: "ethereum"
   - tokenSymbol: "ETH"
   - txType: "buy"
   - quantity: "1.5"
   - priceUsd: "2000"
   - timestamp: (today's date)
   - txHash: "0xtest123"
   - source: "wallet"

4. Save and refresh the P&L page - you'll see calculations!

### Option B: Use API Directly
```bash
# Get your JWT token from browser localStorage
# Then test the endpoints:

curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/transactions

curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/pnl/summary
```

## 📊 Features Overview

### Transaction History Page
**URL:** `/dashboard/transactions`

**Features:**
- ✅ Paginated list (20 per page)
- ✅ Filter by token (ETH, USDC, etc.)
- ✅ Filter by type (buy, sell, swap, transfer, fee)
- ✅ Sort by date, price, or quantity
- ✅ Export to CSV
- ✅ Shows: Date, Token, Type, Quantity, Price, Total, Chain

**Color Coding:**
- 🟢 Green = Buy
- 🔴 Red = Sell
- 🔵 Blue = Swap
- ⚪ Gray = Transfer
- 🟠 Orange = Fee

### P&L Dashboard Page
**URL:** `/dashboard/pnl`

**Features:**
- ✅ Summary cards (Realized, Unrealized, Total)
- ✅ Cost basis method selector (FIFO, LIFO, Weighted Average)
- ✅ Token-wise breakdown table
- ✅ Percentage gains/losses
- ✅ Sync button (needs blockchain service)
- ✅ Export to CSV

**Color Coding:**
- 🟢 Green = Profit
- 🔴 Red = Loss
- ⚪ Gray = Break-even

## 🎨 UI Elements

### Navigation Tabs
- **Active tab**: Blue underline + blue text
- **Inactive tabs**: Gray text, hover shows gray underline
- **Responsive**: Stacks on mobile

### Buttons
- **Primary** (blue): Main actions (Sync, Export)
- **Secondary** (gray): Less important actions
- **Disabled** (faded): When action not available

### Tables
- **Hover effect**: Row highlights on hover
- **Responsive**: Horizontal scroll on mobile
- **Pagination**: Shows current page and total

## 🔍 Troubleshooting Visual Issues

### Can't See Navigation Tabs?
1. Make sure you're on `/dashboard` page
2. Check browser console for errors
3. Try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### Pages Look Empty?
This is normal! They need transaction data:
1. Either add test data via Prisma Studio
2. Or configure blockchain service for real data

### Styling Looks Off?
1. Make sure Tailwind CSS is working
2. Check if dark mode is enabled (affects colors)
3. Try clearing browser cache

## 📱 Mobile View

The pages are responsive:
- Navigation tabs stack vertically on small screens
- Tables scroll horizontally
- Cards stack in single column
- Filters stack vertically

## 🎯 Next Steps

1. **See the UI**: Just navigate to the tabs - they're there!
2. **Add test data**: Use Prisma Studio to add a few transactions
3. **See calculations**: Refresh P&L page to see the engine work
4. **Configure sync**: Add blockchain service for real data

The UI is 100% ready - it just needs data to display!
