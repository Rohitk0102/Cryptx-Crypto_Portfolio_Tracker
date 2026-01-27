'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Wallet {
    id: string;
    address: string;
    nickname?: string;
    provider?: string;
    chains: Array<{ chain: string }>;
    valueUsd: number;
}

interface WalletListProps {
    wallets: Wallet[];
    onAddWallet: () => void;
    onRemoveWallet?: (walletId: string) => void;
}

export default function WalletList({ wallets, onAddWallet, onRemoveWallet }: WalletListProps) {
    const [expandedWallet, setExpandedWallet] = useState<string | null>(null);

    const getProviderIcon = (provider: string) => {
        switch (provider.toLowerCase()) {
            case 'metamask':
                return '🦊';
            case 'walletconnect':
                return '📱';
            case 'coinbase':
                return '🔵';
            default:
                return '👛';
        }
    };

    const getProviderName = (provider: string) => {
        switch (provider.toLowerCase()) {
            case 'metamask':
                return 'MetaMask';
            case 'walletconnect':
                return 'WalletConnect';
            case 'coinbase':
                return 'Coinbase Wallet';
            default:
                return provider;
        }
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // You could add a toast notification here
    };

    return (
        <Card className="h-fit">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-white">Connected Wallets</h2>
                    <p className="text-xs text-gray-500 mt-1">{wallets.length} wallet{wallets.length !== 1 ? 's' : ''} connected</p>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 rounded-full bg-white/5 hover:bg-primary/20"
                    onClick={onAddWallet}
                >
                    +
                </Button>
            </div>

            <div className="space-y-3">
                {wallets.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-4xl mb-3 opacity-50">👛</div>
                        <p className="text-gray-500 text-sm mb-4">No wallets connected yet</p>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={onAddWallet}
                        >
                            Connect Your First Wallet
                        </Button>
                    </div>
                ) : (
                    wallets.map((wallet) => (
                        <div 
                            key={wallet.id} 
                            className="rounded-xl bg-white/5 hover:bg-white/10 transition border border-white/5 overflow-hidden"
                        >
                            {/* Wallet Header */}
                            <div 
                                className="p-4 cursor-pointer"
                                onClick={() => setExpandedWallet(expandedWallet === wallet.id ? null : wallet.id)}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{getProviderIcon(wallet.provider || 'unknown')}</span>
                                        <div>
                                            <div className="font-medium text-white">
                                                {wallet.nickname || 'Wallet'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {getProviderName(wallet.provider || 'unknown')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                                        Active
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500 font-mono">
                                            {formatAddress(wallet.address)}
                                        </span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                copyToClipboard(wallet.address);
                                            }}
                                            className="p-1 hover:bg-white/10 rounded transition"
                                            title="Copy address"
                                        >
                                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="font-bold text-white">
                                        ${wallet.valueUsd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedWallet === wallet.id && (
                                <div className="px-4 pb-4 border-t border-white/5 pt-3">
                                    <div className="space-y-3">
                                        {/* Full Address */}
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Full Address</div>
                                            <div className="text-xs font-mono text-gray-300 bg-white/5 p-2 rounded break-all">
                                                {wallet.address}
                                            </div>
                                        </div>

                                        {/* Chains */}
                                        <div>
                                            <div className="text-xs text-gray-500 mb-2">Tracked Chains ({wallet.chains.length})</div>
                                            <div className="flex flex-wrap gap-1">
                                                {wallet.chains.map((chain, idx) => (
                                                    <span 
                                                        key={idx} 
                                                        className="px-2 py-1 bg-primary/20 text-primary-foreground text-[10px] rounded border border-primary/20 uppercase font-medium"
                                                    >
                                                        {chain.chain}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        {onRemoveWallet && (
                                            <button
                                                onClick={() => onRemoveWallet(wallet.id)}
                                                className="w-full mt-2 px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition border border-red-500/20 hover:border-red-500/30"
                                            >
                                                Remove Wallet
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}

                {wallets.length > 0 && (
                    <Button 
                        variant="outline" 
                        className="w-full mt-4 border-dashed border-white/20 text-gray-400 hover:text-white"
                        onClick={onAddWallet}
                    >
                        + Link Another Wallet
                    </Button>
                )}
            </div>
        </Card>
    );
}
