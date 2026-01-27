'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { coinGeckoApi, TokenPrice, POPULAR_TOKENS } from '@/lib/coinGeckoApi';
import { Card } from '@/components/ui/Card';

interface TokenWithBalance extends TokenPrice {
    balance?: number;
    valueUsd?: number;
}

export default function RealTimeTracking() {
    const router = useRouter();
    const [tokens, setTokens] = useState<TokenWithBalance[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [filter, setFilter] = useState<'all' | 'gainers' | 'losers'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const loadTokens = async () => {
        try {
            const data = await coinGeckoApi.getPopularTokens();
            setTokens(data);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Error loading tokens:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTokens();

        // Auto-refresh every 30 seconds
        const interval = setInterval(loadTokens, 30000);
        return () => clearInterval(interval);
    }, []);

    const filteredTokens = tokens.filter(token => {
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            if (!token.name.toLowerCase().includes(query) && 
                !token.symbol.toLowerCase().includes(query)) {
                return false;
            }
        }

        // Price change filter
        if (filter === 'gainers') {
            return token.price_change_percentage_24h > 0;
        } else if (filter === 'losers') {
            return token.price_change_percentage_24h < 0;
        }

        return true;
    });

    const formatPrice = (price: number) => {
        if (price < 0.01) {
            return `$${price.toFixed(6)}`;
        } else if (price < 1) {
            return `$${price.toFixed(4)}`;
        } else {
            return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    };

    const formatPercentage = (percentage: number) => {
        const sign = percentage >= 0 ? '+' : '';
        return `${sign}${percentage.toFixed(2)}%`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <div className="text-gray-400">Loading live token data...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Real-Time Token Tracking</h2>
                    <p className="text-sm text-gray-400">
                        Live prices • Updated {lastUpdate.toLocaleTimeString()}
                    </p>
                </div>

                {/* Search */}
                <div className="relative w-full md:w-64">
                    <input
                        type="text"
                        placeholder="Search tokens..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 pl-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        filter === 'all'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                >
                    All Tokens
                </button>
                <button
                    onClick={() => setFilter('gainers')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        filter === 'gainers'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                >
                    📈 Gainers
                </button>
                <button
                    onClick={() => setFilter('losers')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        filter === 'losers'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                >
                    📉 Losers
                </button>
            </div>

            {/* Tokens Grid */}
            <div className="grid gap-4">
                {filteredTokens.map((token) => (
                    <Card
                        key={token.id}
                        hover={true}
                        onClick={() => router.push(`/dashboard/token/${token.id}`)}
                        className="p-4 cursor-pointer group"
                    >
                        <div className="flex items-center justify-between">
                            {/* Token Info */}
                            <div className="flex items-center gap-4 flex-1">
                                <img
                                    src={token.image}
                                    alt={token.name}
                                    className="w-10 h-10 rounded-full"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-white group-hover:text-primary transition">
                                            {token.name}
                                        </h3>
                                        <span className="text-xs text-gray-500 font-mono uppercase">
                                            {token.symbol}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-400 mt-0.5">
                                        Market Cap: ${(token.market_cap / 1e9).toFixed(2)}B
                                    </div>
                                </div>
                            </div>

                            {/* Price Info */}
                            <div className="text-right">
                                <div className="text-xl font-bold text-white mb-1">
                                    {formatPrice(token.current_price)}
                                </div>
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`text-sm font-medium ${
                                            token.price_change_percentage_24h >= 0
                                                ? 'text-green-400'
                                                : 'text-red-400'
                                        }`}
                                    >
                                        {formatPercentage(token.price_change_percentage_24h)}
                                    </div>
                                    {token.price_change_percentage_7d !== undefined && (
                                        <div className="text-xs text-gray-500">
                                            7d: {formatPercentage(token.price_change_percentage_7d)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sparkline */}
                            {token.sparkline_in_7d && (
                                <div className="ml-6 hidden lg:block">
                                    <MiniSparkline
                                        data={token.sparkline_in_7d.price}
                                        isPositive={token.price_change_percentage_7d >= 0}
                                    />
                                </div>
                            )}
                        </div>
                    </Card>
                ))}

                {filteredTokens.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No tokens found matching your search.
                    </div>
                )}
            </div>

            {/* Auto-refresh indicator */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Auto-refreshing every 30 seconds
            </div>
        </div>
    );
}

// Mini sparkline component
function MiniSparkline({ data, isPositive }: { data: number[]; isPositive: boolean }) {
    const width = 100;
    const height = 40;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;

    const points = data.map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="opacity-70">
            <polyline
                points={points}
                fill="none"
                stroke={isPositive ? '#10b981' : '#ef4444'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
