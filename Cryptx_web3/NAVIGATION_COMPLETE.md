# Complete Navigation Structure

## Dashboard Navigation Tabs

The dashboard now has **4 tabs** for easy navigation:

```
┌────────────────────────────────────────────────────────────┐
│  Portfolio  │  Live Tracking  │  Transactions  │  Profit & Loss  │
└────────────────────────────────────────────────────────────┘
```

### 1. Portfolio Tab
**URL:** `/dashboard/portfolio`

**Features:**
- Total portfolio value
- Performance metrics (24h, 7d, 30d changes)
- Portfolio value chart (7 days)
- Asset allocation pie chart
- Connected wallets list
- Refresh button

**What it shows:**
- Your overall portfolio overview
- Charts and analytics
- Wallet management

---

### 2. Live Tracking Tab ⭐ NEW
**URL:** `/dashboard/tracking`

**Features:**
- Real-time token prices
- Market data updates
- Live price tracking
- Token search and monitoring

**What it shows:**
- Real-time cryptocurrency prices
- Market movements
- Token-specific data

---

### 3. Transactions Tab
**URL:** `/dashboard/transactions`

**Features:**
- Paginated transaction table (20 per page)
- Filter by token, type, date
- Sort by date, price, quantity
- Export to CSV
- Color-coded transaction types

**What it shows:**
- Complete transaction history
- Buy, sell, swap, transfer, fee transactions
- Transaction details with timestamps

**Transaction Types:**
- 🟢 Buy
- 🔴 Sell
- 🔵 Swap
- ⚪ Transfer
- 🟠 Fee

---

### 4. Profit & Loss Tab
**URL:** `/dashboard/pnl`

**Features:**
- Summary cards (realized, unrealized, total P&L)
- Cost basis method selector (FIFO, LIFO, Weighted Average)
- Token-wise breakdown table
- Sync transactions button
- Export to CSV

**What it shows:**
- Realized P&L (from closed positions)
- Unrealized P&L (from current holdings)
- Total P&L calculations
- Percentage gains/losses

**Color Coding:**
- 🟢 Profit
- 🔴 Loss
- ⚪ Break-even

---

## Homepage Buttons

The homepage "Choose Your View" section has 4 buttons that navigate to:

1. **Portfolio** → `/dashboard/portfolio`
2. **Live Tracking** → `/dashboard/tracking` ⭐ NEW
3. **Link Another Wallet** → Opens modal
4. **Transaction & P&L** → `/dashboard/pnl`

---

## Navigation Flow

```
Homepage
├── Portfolio Button → /dashboard/portfolio
├── Live Tracking Button → /dashboard/tracking ⭐ NEW
├── Link Wallet Button → Modal → /dashboard/portfolio
└── Transaction & P&L Button → /dashboard/pnl

Dashboard Layout (shared)
├── Portfolio Tab → /dashboard/portfolio
├── Live Tracking Tab → /dashboard/tracking ⭐ NEW
├── Transactions Tab → /dashboard/transactions
└── Profit & Loss Tab → /dashboard/pnl
```

---

## Quick Access URLs

Direct links to each section:

- **Portfolio:** `http://localhost:3000/dashboard/portfolio`
- **Live Tracking:** `http://localhost:3000/dashboard/tracking` ⭐ NEW
- **Transactions:** `http://localhost:3000/dashboard/transactions`
- **Profit & Loss:** `http://localhost:3000/dashboard/pnl`

---

## What Changed

### Added:
1. ✅ New "Live Tracking" tab in navigation
2. ✅ New `/dashboard/tracking` page
3. ✅ Updated homepage "Live Tracking" button to navigate correctly

### Navigation Order:
**Before:**
- Portfolio | Transactions | Profit & Loss

**After:**
- Portfolio | Live Tracking | Transactions | Profit & Loss

---

## Features by Tab

| Tab | Real-time Data | Historical Data | Analytics | Export |
|-----|---------------|-----------------|-----------|--------|
| Portfolio | ✅ | ✅ | ✅ | ❌ |
| Live Tracking | ✅ | ❌ | ✅ | ❌ |
| Transactions | ❌ | ✅ | ❌ | ✅ |
| Profit & Loss | ✅ | ✅ | ✅ | ✅ |

---

## User Journey Examples

### Scenario 1: Check Portfolio Performance
1. Click "Portfolio" tab
2. View total value and charts
3. Check performance metrics

### Scenario 2: Monitor Live Prices
1. Click "Live Tracking" tab ⭐ NEW
2. See real-time token prices
3. Monitor market movements

### Scenario 3: Review Transaction History
1. Click "Transactions" tab
2. Filter by token or date
3. Export to CSV for records

### Scenario 4: Calculate Profit/Loss
1. Click "Profit & Loss" tab
2. Select cost basis method
3. View P&L breakdown
4. Export for tax reporting

---

## Mobile Responsive

All tabs work on mobile devices:
- Navigation tabs scroll horizontally on small screens
- Tables scroll horizontally
- Cards stack vertically
- Touch-friendly buttons

---

## Accessibility

- ✅ Keyboard navigation supported
- ✅ Active tab clearly indicated
- ✅ High contrast colors
- ✅ Screen reader friendly
- ✅ Focus states visible

---

## Summary

The dashboard now has a complete navigation system with 4 dedicated pages:

1. **Portfolio** - Overview and analytics
2. **Live Tracking** - Real-time price monitoring ⭐ NEW
3. **Transactions** - Historical transaction data
4. **Profit & Loss** - P&L calculations and reporting

Each page is independent, fully functional, and accessible from both the homepage and the dashboard navigation tabs! 🎉
