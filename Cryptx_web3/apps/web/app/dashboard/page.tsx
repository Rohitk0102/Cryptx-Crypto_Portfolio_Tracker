'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { portfolioApi, PortfolioResponse } from '@/lib/portfolioApi';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PortfolioValueChart } from '@/components/charts/PortfolioValueChart';
import { AssetAllocationPie } from '@/components/charts/AssetAllocationPie';
import { PerformanceMetrics } from '@/components/charts/PerformanceMetrics';
import RealTimeTracking from '@/components/dashboard/RealTimeTracking';
import AddWalletModal from '@/components/wallet/AddWalletModal';
import WalletList from '@/components/wallet/WalletList';

type TabType = 'portfolio' | 'tracking';

export default function Dashboard() {
    const { isAuthenticated, user } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab') as TabType | null;
    const [activeTab, setActiveTab] = useState<TabType>(tabParam || 'portfolio');
    const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    // Analytics state
    const [historicalData, setHistoricalData] = useState<any[]>([]);
    const [allocation, setAllocation] = useState<any[]>([]);
    const [metrics, setMetrics] = useState<any>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);
    const [showAddWallet, setShowAddWallet] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            router.push('/');
            return;
        }

        loadPortfolio();
    }, [isAuthenticated]);

    // Sync tab with URL parameter
    useEffect(() => {
        if (tabParam && (tabParam === 'portfolio' || tabParam === 'tracking')) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    const loadPortfolio = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await portfolioApi.getPortfolio(true); // Use cached
            setPortfolio(data);

            // Load analytics data
            loadAnalytics();
        } catch (err: any) {
            console.error('Error loading portfolio:', err);
            setError(err.response?.data?.error || 'Failed to load portfolio');
        } finally {
            setLoading(false);
        }
    };

    const loadAnalytics = async () => {
        try {
            setAnalyticsLoading(true);
            const [historyData, allocationData, metricsData] = await Promise.all([
                portfolioApi.getHistory(7),
                portfolioApi.getAllocation(),
                portfolioApi.getMetrics(),
            ]);

            setHistoricalData(historyData.map((s: any) => ({
                date: s.generatedAt,
                value: s.totalValueUsd,
            })));
            setAllocation(allocationData);
            setMetrics(metricsData);
        } catch (err: any) {
            console.error('Error loading analytics:', err);
            // Don't show error for analytics, it's non-critical
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            setError('');
            const data = await portfolioApi.refreshPortfolio();
            setPortfolio(data);

            // Refresh analytics
            loadAnalytics();
        } catch (err: any) {
            console.error('Error refreshing:', err);
            setError(err.response?.data?.error || 'Failed to refresh');
        } finally {
            setRefreshing(false);
        }
    };

    // Auto-refresh every 30 seconds
    useEffect(() => {
        if (!isAuthenticated || !portfolio) return;

        const interval = setInterval(() => {
            loadAnalytics(); // Refresh analytics data
        }, 30000);

        return () => clearInterval(interval);
    }, [isAuthenticated, portfolio]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <div className="text-gray-400">Loading portfolio...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px]" />
                <div className="absolute bottom-[0%] left-[0%] w-[30%] h-[30%] rounded-full bg-accent/5 blur-[100px]" />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-8">
                {/* Header with Back Button */}
                <header className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-4">
                        {/* Back Button */}
                        <button
                            onClick={() => router.push('/')}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/30 transition group"
                            title="Back to Home"
                        >
                            <svg
                                className="w-6 h-6 text-gray-400 group-hover:text-primary transition"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                />
                            </svg>
                        </button>

                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                {activeTab === 'tracking' ? '🔴 Live Token Tracking' : '📊 My Portfolio'}
                            </h1>
                            <p className="text-gray-400 text-sm mt-1 font-mono">
                                {user?.address}
                            </p>
                        </div>
                    </div>

                    {activeTab === 'portfolio' && (
                        <Button
                            onClick={handleRefresh}
                            isLoading={refreshing}
                            variant="secondary"
                            size="sm"
                        >
                            Refresh Data
                        </Button>
                    )}
                </header>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-8 flex items-center gap-3">
                        <span className="text-lg">⚠️</span> {error}
                    </div>
                )}

                {/* Tab Content */}
                {activeTab === 'tracking' ? (
                    <RealTimeTracking />
                ) : portfolio ? (
                    <div className="grid gap-8">
                        {/* Performance Metrics */}
                        {metrics && <PerformanceMetrics metrics={metrics} />}

                        {/* Total Value Card */}
                        <Card className="p-8 border-green-500/10">
                            <div className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Total Net Worth</div>
                            <div className="text-6xl font-black text-white mb-2 tracking-tight">
                                ${portfolio.totalValueUsd.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/5 w-fit px-2 py-1 rounded-lg">
                                <span>Updated: {new Date(portfolio.lastUpdated).toLocaleTimeString()}</span>
                                {portfolio.cached && <span className="text-amber-500">(Cached)</span>}
                            </div>
                        </Card>

                        {/* Charts Row */}
                        <div className="grid lg:grid-cols-2 gap-8">
                            {/* Portfolio Value Chart */}
                            <Card className="p-0 overflow-hidden">
                                <div className="px-6 py-5 border-b border-white/5">
                                    <h2 className="text-lg font-semibold text-white">Portfolio Value (7 Days)</h2>
                                </div>
                                <div className="p-6">
                                    {analyticsLoading ? (
                                        <div className="h-[300px] flex items-center justify-center">
                                            <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : (
                                        <PortfolioValueChart data={historicalData} />
                                    )}
                                </div>
                            </Card>

                            {/* Asset Allocation Pie */}
                            <Card className="p-0 overflow-hidden">
                                <div className="px-6 py-5 border-b border-white/5">
                                    <h2 className="text-lg font-semibold text-white">Asset Allocation</h2>
                                </div>
                                <div className="p-6">
                                    {analyticsLoading ? (
                                        <div className="h-[300px] flex items-center justify-center">
                                            <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : (
                                        <AssetAllocationPie data={allocation} />
                                    )}
                                </div>
                            </Card>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-8">{" "}
                            {/* Assets Table */}
                            <Card className="lg:col-span-2 p-0 overflow-hidden">
                                <div className="px-6 py-5 border-b border-white/5">
                                    <h2 className="text-lg font-semibold text-white">Assets Breakdown</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-white/5">
                                            <tr className="text-left">
                                                <th className="px-6 py-3 text-gray-400 font-medium">Asset</th>
                                                <th className="px-6 py-3 text-gray-400 font-medium text-right">Balance</th>
                                                <th className="px-6 py-3 text-gray-400 font-medium text-right">Value (USD)</th>
                                                <th className="px-6 py-3 text-gray-400 font-medium text-right">Chains</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {portfolio.assets.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                        No assets found. Add a wallet to get started.
                                                    </td>
                                                </tr>
                                            ) : (
                                                portfolio.assets.map((asset) => (
                                                    <tr key={asset.symbol} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="font-bold text-white">{asset.symbol}</div>
                                                                <div className="text-gray-500 text-xs">{asset.name}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-gray-300 font-mono">
                                                            {parseFloat(asset.totalBalance).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-medium text-white">
                                                            ${asset.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex justify-end gap-1 flex-wrap">
                                                                {asset.chains.map((chain, idx) => (
                                                                    <span key={idx} className="px-1.5 py-0.5 bg-primary/20 text-primary-foreground text-[10px] rounded border border-primary/20 uppercase">
                                                                        {chain.chain}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                            {/* Wallets Section */}
                            <WalletList
                                wallets={portfolio.wallets}
                                onAddWallet={() => setShowAddWallet(true)}
                                onRemoveWallet={async (walletId) => {
                                    try {
                                        const { walletApi } = await import('@/lib/portfolioApi');
                                        await walletApi.deleteWallet(walletId);
                                        // Reload portfolio after removing wallet
                                        loadPortfolio();
                                    } catch (err: any) {
                                        console.error('Error removing wallet:', err);
                                        setError(err.response?.data?.error || 'Failed to remove wallet');
                                    }
                                }}
                            />
                        </div>
                    </div>
                ) : (
                    <Card className="text-center py-20">
                        <div className="text-6xl mb-6 grayscale opacity-50">🏦</div>
                        <h2 className="text-2xl font-bold text-white mb-3">No Portfolio Data</h2>
                        <p className="text-gray-400 mb-8 max-w-md mx-auto">
                            Connect your blockchain wallet to instantly view your balances across multiple chains.
                        </p>
                        <Button variant="primary" size="lg">
                            Add Wallet
                        </Button>
                    </Card>
                )}
            </div>

            {/* Add Wallet Modal */}
            <AddWalletModal
                isOpen={showAddWallet}
                onClose={() => setShowAddWallet(false)}
                onSuccess={() => {
                    loadPortfolio(); // Reload portfolio data
                }}
            />
        </div>
    );
}

