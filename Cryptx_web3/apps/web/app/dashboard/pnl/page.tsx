'use client';

import { useState, useEffect } from 'react';
import { 
  getPnLSummary, 
  updateCostBasisMethod, 
  syncTransactions,
  exportPnLCSV,
  type PnLSummaryResponse 
} from '@/lib/pnlApi';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function PnLPage() {
  const [summary, setSummary] = useState<PnLSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [costBasisMethod, setCostBasisMethod] = useState<'FIFO' | 'LIFO' | 'WEIGHTED_AVERAGE'>('FIFO');

  useEffect(() => {
    loadPnLSummary();
  }, []);

  const loadPnLSummary = async () => {
    try {
      setLoading(true);
      const data = await getPnLSummary();
      setSummary(data);
      setCostBasisMethod(data.costBasisMethod as any);
    } catch (error) {
      console.error('Failed to load P&L summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await syncTransactions();
      await loadPnLSummary();
    } catch (error) {
      console.error('Failed to sync transactions:', error);
      alert('Failed to sync transactions. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const handleCostBasisMethodChange = async (method: 'FIFO' | 'LIFO' | 'WEIGHTED_AVERAGE') => {
    try {
      setLoading(true);
      await updateCostBasisMethod(method);
      setCostBasisMethod(method);
      await loadPnLSummary();
    } catch (error) {
      console.error('Failed to update cost basis method:', error);
      alert('Failed to update cost basis method. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (summary) {
      exportPnLCSV(summary);
    }
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatPercentage = (value: string) => {
    const num = parseFloat(value);
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  const getPnLColor = (value: string) => {
    const num = parseFloat(value);
    if (num > 0) return 'text-green-600 dark:text-green-400';
    if (num < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-xl">Loading P&L data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>Profit & Loss Calculator</h1>
        <div className="flex gap-3">
          <Button onClick={handleSync} disabled={syncing}>
            {syncing ? 'Syncing...' : 'Sync Transactions'}
          </Button>
          <Button onClick={handleExport} disabled={!summary}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Cost Basis Method Selector */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Cost Basis Method</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Select how to calculate cost basis for P&L calculations
            </p>
          </div>
          <select
            value={costBasisMethod}
            onChange={(e) => handleCostBasisMethodChange(e.target.value as any)}
            className="px-4 py-2 border rounded-lg"
            style={{ 
              backgroundColor: 'var(--surface)', 
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
            disabled={loading}
          >
            <option value="FIFO">FIFO (First In, First Out)</option>
            <option value="LIFO">LIFO (Last In, First Out)</option>
            <option value="WEIGHTED_AVERAGE">Weighted Average</option>
          </select>
        </div>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Realized P&L
              </h3>
              <div className={`text-3xl font-bold ${getPnLColor(summary.totalRealizedPnL)}`}>
                {formatCurrency(summary.totalRealizedPnL)}
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>From closed positions</p>
            </Card>

            <Card>
              <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Unrealized P&L
              </h3>
              <div className={`text-3xl font-bold ${getPnLColor(summary.totalUnrealizedPnL)}`}>
                {formatCurrency(summary.totalUnrealizedPnL)}
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>From current holdings</p>
            </Card>

            <Card>
              <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                Total P&L
              </h3>
              <div className={`text-3xl font-bold ${getPnLColor(summary.totalPnL)}`}>
                {formatCurrency(summary.totalPnL)}
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Combined total</p>
            </Card>
          </div>

          {/* Token Breakdown */}
          <Card>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Token-wise Breakdown</h2>
            {summary.byToken.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                No P&L data available. Sync your transactions to see P&L breakdown.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th className="text-left py-3 px-4" style={{ color: 'var(--text-primary)' }}>Token</th>
                      <th className="text-right py-3 px-4" style={{ color: 'var(--text-primary)' }}>Holdings</th>
                      <th className="text-right py-3 px-4" style={{ color: 'var(--text-primary)' }}>Cost Basis</th>
                      <th className="text-right py-3 px-4" style={{ color: 'var(--text-primary)' }}>Current Value</th>
                      <th className="text-right py-3 px-4" style={{ color: 'var(--text-primary)' }}>Unrealized P&L</th>
                      <th className="text-right py-3 px-4" style={{ color: 'var(--text-primary)' }}>Realized P&L</th>
                      <th className="text-right py-3 px-4" style={{ color: 'var(--text-primary)' }}>Total P&L</th>
                      <th className="text-right py-3 px-4" style={{ color: 'var(--text-primary)' }}>Gain %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.byToken.map((token) => (
                      <tr key={token.tokenSymbol} style={{ borderBottom: '1px solid var(--border)' }} className="hover:bg-[var(--surface-elevated)]">
                        <td className="py-3 px-4 font-medium" style={{ color: 'var(--text-primary)' }}>{token.tokenSymbol}</td>
                        <td className="py-3 px-4 text-right" style={{ color: 'var(--text-secondary)' }}>
                          {parseFloat(token.holdings || '0').toFixed(4)}
                        </td>
                        <td className="py-3 px-4 text-right" style={{ color: 'var(--text-secondary)' }}>
                          {formatCurrency(token.costBasis || '0')}
                        </td>
                        <td className="py-3 px-4 text-right" style={{ color: 'var(--text-secondary)' }}>
                          {formatCurrency(token.currentValue || '0')}
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${getPnLColor(token.unrealizedPnL || '0')}`}>
                          {formatCurrency(token.unrealizedPnL || '0')}
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${getPnLColor(token.realizedPnL || '0')}`}>
                          {formatCurrency(token.realizedPnL || '0')}
                        </td>
                        <td className={`py-3 px-4 text-right font-bold ${getPnLColor(token.totalPnL || '0')}`}>
                          {formatCurrency(token.totalPnL || '0')}
                        </td>
                        <td className={`py-3 px-4 text-right ${getPnLColor(token.percentageGain || '0')}`}>
                          {formatPercentage(token.percentageGain || '0')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
