'use client';

import { Card } from '@/components/ui/Card';

interface PerformanceMetrics {
    change24h: number;
    change7d: number;
    change30d: number;
    changeAll: number;
    highestValue?: number;
    lowestValue?: number;
}

export function PerformanceMetrics({ metrics }: { metrics: PerformanceMetrics }) {
    const formatChange = (value: number) => {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(2)}%`;
    };

    const getChangeColor = (value: number) => {
        return value >= 0 ? 'text-green-400' : 'text-red-400';
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 hover:bg-white/10 transition-colors">
                <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">24h Change</div>
                <div className={`text-2xl font-bold ${getChangeColor(metrics.change24h)}`}>
                    {formatChange(metrics.change24h)}
                </div>
            </Card>

            <Card className="p-4 hover:bg-white/10 transition-colors">
                <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">7d Change</div>
                <div className={`text-2xl font-bold ${getChangeColor(metrics.change7d)}`}>
                    {formatChange(metrics.change7d)}
                </div>
            </Card>

            <Card className="p-4 hover:bg-white/10 transition-colors">
                <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">30d Change</div>
                <div className={`text-2xl font-bold ${getChangeColor(metrics.change30d)}`}>
                    {formatChange(metrics.change30d)}
                </div>
            </Card>

            <Card className="p-4 hover:bg-white/10 transition-colors">
                <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">All Time</div>
                <div className={`text-2xl font-bold ${getChangeColor(metrics.changeAll)}`}>
                    {formatChange(metrics.changeAll)}
                </div>
            </Card>
        </div>
    );
}
