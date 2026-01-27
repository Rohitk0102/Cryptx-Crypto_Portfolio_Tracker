'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface AssetAllocation {
    symbol: string;
    name: string;
    value: number;
    percentage: number;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="glass p-3 rounded-xl border border-white/20">
                <p className="text-white font-bold text-sm">{data.symbol}</p>
                <p className="text-xs text-gray-400">{data.name}</p>
                <p className="text-white font-medium mt-1">
                    ${data.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-300">
                    {data.percentage.toFixed(2)}%
                </p>
            </div>
        );
    }
    return null;
};

export function AssetAllocationPie({ data }: { data: AssetAllocation[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
                <p>No assets to display</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ symbol, percentage }) => `${symbol} ${percentage.toFixed(1)}%`}
                    labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            className="hover:opacity-80 transition-opacity cursor-pointer"
                        />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry: any) => (
                        <span className="text-gray-300 text-xs">{entry.payload.symbol}</span>
                    )}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
