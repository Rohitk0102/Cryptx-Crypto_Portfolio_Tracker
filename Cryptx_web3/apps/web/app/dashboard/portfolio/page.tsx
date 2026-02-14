'use client';

import { useEffect, useState, useCallback, memo } from 'react';
import { portfolioApi, walletApi, PortfolioResponse } from '@/lib/portfolioApi';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PortfolioValueChart } from '@/components/charts/PortfolioValueChart';
import { AssetAllocationPie } from '@/components/charts/AssetAllocationPie';
import { PerformanceMetrics } from '@/components/charts/PerformanceMetrics';
import RealTimeTracking from '@/components/dashboard/RealTimeTracking';
import AddWalletModal from '@/components/wallet/AddWalletModal';
import WalletList from '@/components/wallet/WalletList';

type TabType = 'portfolio' | 'tracking';

// Cache portfolio data
let portfolioCache: { data: PortfolioResponse; timestamp: number } | null = null;
const CACHE_DURATION = 30000; // 30 seconds

export default function PortfolioPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
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

    const loadPortfolio = useCallback(async (force = false) => {
        try {
            setLoading(true);
            setError('');

            // Use cache if available and valid
            if (!force && portfolioCache && Date.now() - portfolioCache.timestamp < CACHE_DURATION) {
                setPortfolio(portfolioCache.data);
                setLoading(false);
                loadAnalytics();
                return;
            }

            const data = await portfolioApi.getPortfolio(true);
            portfolioCache = { data, timestamp: Date.now() };
            setPortfolio(data);
            loadAnalytics();
        } catch (err: any) {
            console.error('Error loading portfolio:', err);
            setError(err.response?.data?.error || 'Failed to load portfolio');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPortfolio();
        
        // Listen for auth cleared event to reset cache
        const handleAuthCleared = () => {
            console.log('🔄 Auth cleared, resetting portfolio cache');
            portfolioCache = null;
            setPortfolio(null);
        };
        
        // Listen for auth synced event to reload portfolio
        const handleAuthSynced = () => {
            console.log('🔄 Auth synced, reloading portfolio');
            portfolioCache = null;
            loadPortfolio(true);
        };
        
        window.addEventListener('auth-cleared', handleAuthCleared);
        window.addEventListener('auth-synced', handleAuthSynced);
        
        return () => {
            window.removeEventListener('auth-cleared', handleAuthCleared);
            window.removeEventListener('auth-synced', handleAuthSynced);
        };
    }, [loadPortfolio]);

    // Sync tab with URL parameter
    useEffect(() => {
        if (tabParam && (tabParam === 'portfolio' || tabParam === 'tracking')) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

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
        } finally {
            setAnalyticsLoading(false);
        }
    };

    const handleRefresh = useCallback(async () => {
        try {
            setRefreshing(true);
            setError('');
            const data = await portfolioApi.refreshPortfolio();
            portfolioCache = { data, timestamp: Date.now() };
            setPortfolio(data);
            loadAnalytics();
        } catch (err: any) {
            console.error('Error refreshing:', err);
            setError(err.response?.data?.error || 'Failed to refresh');
        } finally {
            setRefreshing(false);
        }
    }, []);

    const handleRemoveWallet = useCallback(async (walletId: string) => {
        try {
            console.log('🗑️ Removing wallet with ID:', walletId);

            await walletApi.deleteWallet(walletId);
            console.log('✅ Delete API response');

            // Check if this was the last wallet
            const remainingWallets = await walletApi.getWallets();
            
            if (remainingWallets.length === 0) {
                console.log('📭 No wallets remaining, redirecting to home...');
                portfolioCache = null;
                router.push('/');
                return;
            }

            console.log('🔄 Reloading portfolio...');
            portfolioCache = null; // Clear cache
            await loadPortfolio(true);
            console.log('✅ Portfolio reloaded successfully');

        } catch (err: any) {
            console.error('❌ Error removing wallet:', err);

            const errorMsg = err.response?.data?.error || err.message || 'Failed to remove wallet';
            setError(errorMsg);
            alert(`Failed to remove wallet: ${errorMsg}\n\nCheck console for details.`);

            return false;
        }
    }, [loadPortfolio, router]);

    const handleWalletAdded = useCallback(() => {
        setShowAddWallet(false);
        portfolioCache = null; // Clear cache
        loadPortfolio(true);
    }, [loadPortfolio]);

    // Auto-refresh every 30 seconds only when portfolio tab is active
    useEffect(() => {
        if (!portfolio || activeTab !== 'portfolio') return;

        const interval = setInterval(() => {
            loadAnalytics();
        }, 30000);

        return () => clearInterval(interval);
    }, [portfolio, activeTab]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                    <div className="text-text-secondary">Loading portfolio...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {activeTab === 'tracking' ? 'Live Token Tracking' : 'Portfolio Overview'}
                </h2>
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
            </div>

            {error && (
                <div className="bg-surface border border-error text-error px-4 py-3 rounded-[2px] flex items-center gap-3">
                    <span className="text-lg">⚠️</span> {error}
                </div>
            )}

            {/* Tab Content */}
            {activeTab === 'tracking' ? (
                <RealTimeTracking />
            ) : portfolio ? (
                <PortfolioContent
                    portfolio={portfolio}
                    metrics={metrics}
                    historicalData={historicalData}
                    allocation={allocation}
                    analyticsLoading={analyticsLoading}
                    onAddWallet={() => setShowAddWallet(true)}
                    onRemoveWallet={handleRemoveWallet}
                />
            ) : (
                <Card className="p-8 text-center">
                    <div className="text-text-secondary mb-4">No Portfolio Data</div>
                    <Button onClick={() => setShowAddWallet(true)}>
                        Add Wallet
                    </Button>
                </Card>
            )}

            {/* Add Wallet Modal */}
            {showAddWallet && (
                <AddWalletModal
                    isOpen={showAddWallet}
                    onClose={() => setShowAddWallet(false)}
                    onSuccess={handleWalletAdded}
                />
            )}
        </div>
    );
}

// Memoized Portfolio Content Component
const PortfolioContent = memo(function PortfolioContent({
    portfolio,
    metrics,
    historicalData,
    allocation,
    analyticsLoading,
    onAddWallet,
    onRemoveWallet,
}: {
    portfolio: PortfolioResponse;
    metrics: any;
    historicalData: any[];
    allocation: any[];
    analyticsLoading: boolean;
    onAddWallet: () => void;
    onRemoveWallet: (walletId: string) => void;
}) {
    return (
        <div className="grid gap-8">
            {/* Performance Metrics */}
            {metrics && <PerformanceMetrics metrics={metrics} />}

            {/* Total Value Card */}
            <Card className="p-8">
                <div className="text-text-secondary text-sm font-medium uppercase tracking-wider mb-2">
                    Total Net Worth
                </div>
                <div className="text-6xl font-black text-text-primary mb-2 tracking-tight">
                    ${portfolio.totalValueUsd.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary bg-surface-elevated w-fit px-2 py-1 rounded-[2px]">
                    <span>Updated: {new Date(portfolio.lastUpdated).toLocaleTimeString()}</span>
                    {portfolio.cached && <span className="text-warning">(Cached)</span>}
                </div>
            </Card>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-8">
                <Card className="p-0 overflow-hidden">
                    <div className="px-6 py-5 border-b border-border">
                        <h2 className="text-lg font-semibold text-text-primary">
                            Portfolio Value (7 Days)
                        </h2>
                    </div>
                    <div className="p-6">
                        {analyticsLoading ? (
                            <div className="h-[300px] flex items-center justify-center">
                                <div className="w-6 h-6 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <PortfolioValueChart data={historicalData} />
                        )}
                    </div>
                </Card>

                <Card className="p-0 overflow-hidden">
                    <div className="px-6 py-5 border-b border-border">
                        <h2 className="text-lg font-semibold text-text-primary">
                            Asset Allocation
                        </h2>
                    </div>
                    <div className="p-6">
                        {analyticsLoading ? (
                            <div className="h-[300px] flex items-center justify-center">
                                <div className="w-6 h-6 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <AssetAllocationPie data={allocation} />
                        )}
                    </div>
                </Card>
            </div>

            {/* Wallet List */}
            <WalletList
                wallets={portfolio.wallets || []}
                onAddWallet={onAddWallet}
                onRemoveWallet={onRemoveWallet}
            />
        </div>
    );
});
