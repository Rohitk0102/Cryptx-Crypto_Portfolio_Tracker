'use client';

import { useState, useEffect } from 'react';
import { getTransactions, exportTransactionsCSV, type Transaction } from '@/lib/pnlApi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [tokenFilter, setTokenFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const limit = 20;

  useEffect(() => {
    loadTransactions();
  }, [page, tokenFilter, typeFilter, sortBy, sortOrder]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await getTransactions({
        page,
        limit,
        tokenSymbol: tokenFilter || undefined,
        txType: typeFilter || undefined,
        sortBy,
        sortOrder,
      });
      
      setTransactions(response.transactions);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    exportTransactionsCSV(transactions);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatNumber = (value: string, decimals: number = 4) => {
    return parseFloat(value).toFixed(decimals);
  };

  const getTxTypeColor = (type: string) => {
    switch (type) {
      case 'buy': return 'text-green-600 dark:text-green-400';
      case 'sell': return 'text-red-600 dark:text-red-400';
      case 'swap': return 'text-blue-600 dark:text-blue-400';
      case 'transfer': return 'text-gray-600 dark:text-gray-400';
      case 'fee': return 'text-orange-600 dark:text-orange-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Transaction History</h1>
        <Button onClick={handleExport} disabled={transactions.length === 0}>
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Token</label>
            <input
              type="text"
              value={tokenFilter}
              onChange={(e) => {
                setTokenFilter(e.target.value);
                setPage(1);
              }}
              placeholder="e.g., ETH"
              className="w-full px-3 py-2 border rounded-lg"
              style={{ 
                backgroundColor: 'var(--surface)', 
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Type</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border rounded-lg"
              style={{ 
                backgroundColor: 'var(--surface)', 
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="">All Types</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
              <option value="swap">Swap</option>
              <option value="transfer">Transfer</option>
              <option value="fee">Fee</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              style={{ 
                backgroundColor: 'var(--surface)', 
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="timestamp">Date</option>
              <option value="priceUsd">Price</option>
              <option value="quantity">Quantity</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
              className="w-full px-3 py-2 border rounded-lg"
              style={{ 
                backgroundColor: 'var(--surface)', 
                borderColor: 'var(--border)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Transactions Table */}
      <Card>
        {loading ? (
          <div className="text-center py-8" style={{ color: 'var(--text-primary)' }}>Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
            No transactions found. Try adjusting your filters.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th className="text-left py-3 px-4" style={{ color: 'var(--text-primary)' }}>Date</th>
                    <th className="text-left py-3 px-4" style={{ color: 'var(--text-primary)' }}>Token</th>
                    <th className="text-left py-3 px-4" style={{ color: 'var(--text-primary)' }}>Type</th>
                    <th className="text-right py-3 px-4" style={{ color: 'var(--text-primary)' }}>Quantity</th>
                    <th className="text-right py-3 px-4" style={{ color: 'var(--text-primary)' }}>Price (USD)</th>
                    <th className="text-right py-3 px-4" style={{ color: 'var(--text-primary)' }}>Total (USD)</th>
                    <th className="text-left py-3 px-4" style={{ color: 'var(--text-primary)' }}>Chain</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-[var(--surface-elevated)]">
                      <td className="py-3 px-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{formatDate(tx.timestamp)}</td>
                      <td className="py-3 px-4 font-medium" style={{ color: 'var(--text-primary)' }}>{tx.tokenSymbol}</td>
                      <td className={`py-3 px-4 font-medium capitalize ${getTxTypeColor(tx.txType)}`}>
                        {tx.txType}
                      </td>
                      <td className="py-3 px-4 text-right" style={{ color: 'var(--text-secondary)' }}>{formatNumber(tx.quantity)}</td>
                      <td className="py-3 px-4 text-right" style={{ color: 'var(--text-secondary)' }}>${formatNumber(tx.priceUsd, 2)}</td>
                      <td className="py-3 px-4 text-right font-medium" style={{ color: 'var(--text-primary)' }}>
                        ${formatNumber((parseFloat(tx.quantity) * parseFloat(tx.priceUsd)).toString(), 2)}
                      </td>
                      <td className="py-3 px-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {tx.chain}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} transactions
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="px-4 py-2" style={{ color: 'var(--text-primary)' }}>
                  Page {page} of {totalPages}
                </span>
                <Button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
