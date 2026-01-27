import { useState, useEffect } from 'react'
import axios from 'axios'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface TokenBalance {
  symbol: string
  name: string
  balance: string
  decimals: number
  usdValue: number
  percentage: number
  logo: string
  contractAddress: string
  priceChange24h?: number
}

interface PortfolioData {
  walletAddress: string
  chainId: number
  totalValue: number
  tokens: TokenBalance[]
  lastUpdated: string
}

interface PortfolioDashboardProps {
  address: string
  chainId: number
}

// Modern color palette for charts
const CHART_COLORS = [
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#6366f1', // Indigo
  '#84cc16', // Lime
]

export function PortfolioDashboard({ address, chainId }: PortfolioDashboardProps) {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const backendUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000'

  useEffect(() => {
    fetchPortfolio()
    
    // Auto-refresh every 60 seconds if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchPortfolio, 60000)
      return () => clearInterval(interval)
    }
  }, [address, chainId, autoRefresh])

  const fetchPortfolio = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await axios.get(
        `${backendUrl}/api/portfolio/${address}`,
        {
          params: { chainId }
        }
      )

      if (response.data.success) {
        setPortfolio(response.data.data)
      }
    } catch (err) {
      setError('Failed to fetch portfolio data')
      console.error('Error fetching portfolio:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`
  }

  const formatPriceChange = (change: number | undefined) => {
    if (change === undefined) return null
    const isPositive = change >= 0
    return (
      <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
        {isPositive ? '↑' : '↓'} {isPositive ? '+' : ''}{change.toFixed(2)}%
      </span>
    )
  }

  // Prepare chart data
  const chartData = portfolio?.tokens.slice(0, 10).map((token, index) => ({
    name: token.symbol,
    value: token.usdValue,
    percentage: token.percentage,
    color: CHART_COLORS[index % CHART_COLORS.length]
  })) || []

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-sm text-primary">
            {payload[0].payload.percentage.toFixed(2)}%
          </p>
        </div>
      )
    }
    return null
  }

  const networkName = (() => {
    switch (chainId) {
      case 1:
        return 'Ethereum Mainnet'
      case 137:
        return 'Polygon PoS'
      case 56:
        return 'Binance Smart Chain'
      default:
        return `Chain ${chainId}`
    }
  })()

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-2xl">💼</span>
            </div>
            <h2 className="text-2xl font-bold">Portfolio Dashboard</h2>
          </div>
        </div>
        <div className="flex justify-center py-20">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-2xl">💼</span>
            </div>
            <h2 className="text-2xl font-bold">Portfolio Dashboard</h2>
          </div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-red-500 font-medium mb-4">{error}</p>
          <button
            onClick={fetchPortfolio}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all hover:scale-105 font-medium"
          >
            🔄 Retry
          </button>
        </div>
      </div>
    )
  }

  if (!portfolio || portfolio.tokens.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="text-2xl">💼</span>
            </div>
            <h2 className="text-2xl font-bold">Portfolio Dashboard</h2>
          </div>
        </div>
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-xl text-muted-foreground mb-2">No tokens found</p>
          <p className="text-sm text-muted-foreground">
            This wallet doesn't have any tokens on this chain
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <span className="text-2xl">💼</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">Portfolio Dashboard</h2>
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date(portfolio.lastUpdated).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                autoRefresh
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-secondary text-secondary-foreground'
              }`}
            >
              {autoRefresh ? '🔄 Auto-refresh ON' : '⏸️ Auto-refresh OFF'}
            </button>
            <button
              onClick={fetchPortfolio}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-all hover:scale-105 font-medium"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between card-hover">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Portfolio Value</span>
            <span className="text-lg">💰</span>
          </div>
          <div className="text-3xl font-semibold mb-1">
            {formatCurrency(portfolio.totalValue)}
          </div>
          <div className="text-xs text-muted-foreground">
            {portfolio.tokens.length} {portfolio.tokens.length === 1 ? 'asset held' : 'assets held'}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between card-hover">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Assets Breakdown</span>
            <span className="text-lg">📊</span>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-semibold">{portfolio.tokens.length}</div>
              <div className="text-xs text-muted-foreground">Tracked tokens</div>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <div>Top position</div>
              {portfolio.tokens[0] && (
                <div className="mt-0.5 font-medium">
                  {portfolio.tokens[0].symbol} · {formatPercentage(portfolio.tokens[0].percentage)}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm flex flex-col justify-between card-hover">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Network</span>
            <span className="text-lg">🌐</span>
          </div>
          <div className="text-sm font-semibold mb-1">{networkName}</div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Wallet</span>
            <span className="font-mono">{address.slice(0, 6)}...{address.slice(-4)}</span>
          </div>
        </div>
      </div>

      {/* Chart and Assets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Allocation Chart */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xl">📊</span>
            <h3 className="text-xl font-bold">Asset Allocation</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.name} ${entry.percentage.toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Assets */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xl">🏆</span>
            <h3 className="text-xl font-bold">Top Assets</h3>
          </div>
          <div className="space-y-3">
            {portfolio.tokens.slice(0, 5).map((token, index) => (
              <div
                key={token.contractAddress || token.symbol}
                className="flex items-center gap-3 p-3 bg-background/50 rounded-xl hover:bg-accent transition-all hover:scale-[1.02]"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 font-bold text-sm">
                  #{index + 1}
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                  {token.logo ? (
                    <img
                      src={token.logo}
                      alt={token.symbol}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <span className="text-sm font-bold">{token.symbol.slice(0, 2)}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{token.symbol}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatPercentage(token.percentage)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCurrency(token.usdValue)}</div>
                  {token.priceChange24h !== undefined && (
                    <div className="text-xs">
                      {formatPriceChange(token.priceChange24h)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All Assets List */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xl">💎</span>
          <h3 className="text-xl font-bold">All Assets</h3>
        </div>
        <div className="space-y-3">
          {portfolio.tokens.map((token) => (
            <div
              key={token.contractAddress || token.symbol}
              className="flex items-center justify-between p-4 bg-background/50 border border-border/50 rounded-xl hover:bg-accent transition-all hover:scale-[1.01] hover:shadow-md"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-md">
                  {token.logo ? (
                    <img
                      src={token.logo}
                      alt={token.symbol}
                      className="w-10 h-10 rounded-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <span className="text-lg font-bold">{token.symbol.slice(0, 2)}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg">{token.symbol}</span>
                    <span className="text-sm text-muted-foreground">{token.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {parseFloat(token.balance).toFixed(4)} {token.symbol}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg mb-1">{formatCurrency(token.usdValue)}</div>
                <div className="flex items-center gap-3 justify-end">
                  <span className="text-sm px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
                    {formatPercentage(token.percentage)}
                  </span>
                  {token.priceChange24h !== undefined && (
                    <span className="text-sm font-medium">
                      {formatPriceChange(token.priceChange24h)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
