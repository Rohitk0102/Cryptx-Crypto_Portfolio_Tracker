import { useState, useEffect } from 'react'
import axios from 'axios'

interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  token: string
  timestamp: number
  status: 'success' | 'pending' | 'failed'
  gasUsed: string
  blockNumber: number
  tokenSymbol?: string
}

interface TransactionHistoryProps {
  address: string
  chainId: number
}

export function TransactionHistory({ address, chainId }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const backendUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3000'

  useEffect(() => {
    fetchTransactions()
  }, [address, chainId, page])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await axios.get(
        `${backendUrl}/api/transactions/${address}`,
        {
          params: { chainId, page, pageSize: 20 }
        }
      )

      if (response.data.success) {
        setTransactions(response.data.data.transactions)
        setHasMore(response.data.data.pagination.hasMore)
      }
    } catch (err) {
      setError('Failed to fetch transactions')
      console.error('Error fetching transactions:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const getExplorerUrl = (hash: string) => {
    const explorers: Record<number, string> = {
      1: 'https://etherscan.io/tx/',
      137: 'https://polygonscan.com/tx/',
      56: 'https://bscscan.com/tx/'
    }
    return `${explorers[chainId] || explorers[1]}${hash}`
  }

  const successCount = transactions.filter((tx) => tx.status === 'success').length
  const pendingCount = transactions.filter((tx) => tx.status === 'pending').length
  const failedCount = transactions.filter((tx) => tx.status === 'failed').length

  if (loading && transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-2xl">📜</span>
          </div>
          <h2 className="text-2xl font-bold">Transaction History</h2>
        </div>
        <div className="flex justify-center py-16">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/20 border-t-primary"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-2xl">📜</span>
          </div>
          <h2 className="text-2xl font-bold">Transaction History</h2>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-red-500 font-medium mb-4">{error}</p>
          <button
            onClick={fetchTransactions}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all hover:scale-105 font-medium"
          >
            🔄 Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="text-2xl">📜</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Transaction History</h2>
            <p className="text-sm text-muted-foreground">
              {transactions.length > 0 ? `${transactions.length} transactions` : 'No transactions'}
            </p>
          </div>
        </div>
        {transactions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full border border-green-100 bg-green-50 px-2.5 py-1 text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span>{successCount} successful</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-yellow-100 bg-yellow-50 px-2.5 py-1 text-yellow-700">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              <span>{pendingCount} pending</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-red-700">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              <span>{failedCount} failed</span>
            </span>
          </div>
        )}
      </div>
      
      {transactions.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-xl text-muted-foreground mb-2">No transactions found</p>
          <p className="text-sm text-muted-foreground">
            Transactions will appear here once you make them
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.hash}
                className="flex items-center justify-between p-5 rounded-xl border border-border/60 bg-card hover:bg-secondary transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                      <span className="text-lg">💸</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{tx.tokenSymbol || tx.token}</span>
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-medium ${
                            tx.status === 'success'
                              ? 'bg-green-500/20 text-green-500'
                              : tx.status === 'failed'
                              ? 'bg-red-500/20 text-red-500'
                              : 'bg-yellow-500/20 text-yellow-500'
                          }`}
                        >
                          {tx.status === 'success' ? '✓ Success' : tx.status === 'failed' ? '✗ Failed' : '⏳ Pending'}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <span className="font-mono">{formatAddress(tx.from)}</span>
                        <span className="mx-2">→</span>
                        <span className="font-mono">{formatAddress(tx.to)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground ml-13">
                    <span>🕐 {formatDate(tx.timestamp)}</span>
                    <span>📦 Block: {tx.blockNumber}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold text-lg">{parseFloat(tx.value).toFixed(4)}</div>
                    <div className="text-xs text-muted-foreground">{tx.tokenSymbol || tx.token}</div>
                  </div>
                  <a
                    href={getExplorerUrl(tx.hash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all hover:scale-105 font-medium"
                  >
                    🔍 View
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 font-medium"
            >
              ← Previous
            </button>
            <div className="flex items-center gap-2">
              <span className="px-4 py-2 bg-primary/10 text-primary rounded-xl font-bold">
                Page {page}
              </span>
            </div>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore}
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 font-medium"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  )
}
