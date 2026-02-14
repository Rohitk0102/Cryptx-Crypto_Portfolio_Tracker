# How to Access Transaction & P&L Features

## ✅ Fixed! Each Tab Now Shows Its Own Content

The navigation has been restructured so each tab displays its own independent content:

### 📍 Direct URLs

1. **Portfolio Tab**
   - URL: `http://localhost:3000/dashboard/portfolio`
   - Shows: Your portfolio overview, charts, wallet list

2. **Transactions Tab**
   - URL: `http://localhost:3000/dashboard/transactions`
   - Shows: Transaction history with filters and export

3. **P&L Tab**
   - URL: `http://localhost:3000/dashboard/pnl`
   - Shows: Profit & Loss calculations and summaries

### 🎯 How It Works Now

```
Dashboard Layout (shared header + navigation)
├── Portfolio Page (/dashboard/portfolio)
│   └── Portfolio content only
├── Transactions Page (/dashboard/transactions)
│   └── Transaction history only
└── P&L Page (/dashboard/pnl)
    └── P&L calculations only
```

### 🔄 What Changed

**Before:**
- Clicking tabs showed portfolio content everywhere
- Navigation didn't work properly

**After:**
- Each tab has its own dedicated page
- Navigation works independently
- Shared layout for header and tabs
- Clean separation of concerns

### 🚀 Testing It

1. **Start the servers:**
   ```bash
   # Terminal 1 - Backend
   cd apps/api
   npm run dev
   
   # Terminal 2 - Frontend  
   cd apps/web
   npm run dev
   ```

2. **Navigate to dashboard:**
   - Go to: `http://localhost:3000/dashboard`
   - You'll be redirected to `/dashboard/portfolio`

3. **Click the tabs:**
   - **Portfolio** → Shows portfolio overview
   - **Transactions** → Shows transaction history
   - **P&L** → Shows profit & loss dashboard

### 📊 What Each Page Shows

#### Portfolio Page
- Total portfolio value
- Performance metrics (24h, 7d, 30d changes)
- Portfolio value chart (7 days)
- Asset allocation pie chart
- Connected wallets list
- Refresh button

#### Transactions Page
- Paginated transaction table
- Filters: Token, Type, Date
- Sorting: Date, Price, Quantity
- Export to CSV button
- Color-coded transaction types:
  - 🟢 Buy
  - 🔴 Sell
  - 🔵 Swap
  - ⚪ Transfer
  - 🟠 Fee

#### P&L Page
- Summary cards:
  - Realized P&L (from closed positions)
  - Unrealized P&L (from current holdings)
  - Total P&L (combined)
- Cost basis method selector (FIFO/LIFO/Weighted Average)
- Token-wise breakdown table
- Sync transactions button
- Export to CSV button
- Color-coded profit/loss:
  - 🟢 Profit
  - 🔴 Loss

### 🎨 Visual Structure

```
┌─────────────────────────────────────────────────────┐
│  [Back] Dashboard                    [Connect Wallet]│
├─────────────────────────────────────────────────────┤
│  Portfolio  │  Transactions  │  P&L                 │
│  ─────────                                           │
├─────────────────────────────────────────────────────┤
│                                                      │
│  (Content changes based on selected tab)            │
│                                                      │
│  - Portfolio: Charts, metrics, wallets              │
│  - Transactions: Transaction table with filters     │
│  - P&L: Summary cards and breakdown table           │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### 🔍 Troubleshooting

#### Tabs Not Showing Different Content?
1. Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)
2. Check browser console for errors
3. Make sure both servers are running

#### Still Seeing Portfolio Everywhere?
1. Check the URL in the address bar
2. It should change when clicking tabs:
   - `/dashboard/portfolio`
   - `/dashboard/transactions`
   - `/dashboard/pnl`

#### Pages Look Empty?
This is normal for Transactions and P&L pages if you don't have data yet:
- **Transactions**: Shows "No transactions found"
- **P&L**: Shows $0.00 in all cards

To add test data:
```bash
cd apps/api
npx prisma studio
```
Add records to the `PnLTransaction` table.

### ✨ Key Features

**Independent Pages:**
- ✅ Each tab loads its own content
- ✅ No interference between pages
- ✅ Separate data loading
- ✅ Independent error handling

**Shared Layout:**
- ✅ Common header with back button
- ✅ Navigation tabs always visible
- ✅ User info displayed
- ✅ Connect wallet button

**Responsive Design:**
- ✅ Works on desktop and mobile
- ✅ Tables scroll horizontally on small screens
- ✅ Navigation stacks on mobile

### 🎯 Next Steps

1. **Test the navigation** - Click between tabs
2. **Add test data** - Use Prisma Studio
3. **See calculations** - Watch P&L update
4. **Export data** - Test CSV export

Everything is now properly separated and working independently!
