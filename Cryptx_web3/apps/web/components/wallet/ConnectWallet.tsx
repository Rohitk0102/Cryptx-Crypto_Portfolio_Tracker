'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useWalletConnect } from '@/hooks/useWalletConnect';
import { Button } from '@/components/ui/Button';

export default function ConnectWallet() {
    const { isAuthenticated, user } = useAuthStore();
    const { connect, disconnect, isConnecting, error } = useWalletConnect();
    const [showOptions, setShowOptions] = useState(false);

    if (isAuthenticated && user) {
        return (
            <div className="flex items-center gap-3 border border-border bg-surface px-4 py-2 rounded-[2px]">
                <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-text-primary">
                        {user.address.slice(0, 6)}...{user.address.slice(-4)}
                    </span>
                    <span className="text-xs text-success uppercase tracking-wide">
                        Connected
                    </span>
                </div>
                <Button
                    onClick={disconnect}
                    variant="ghost"
                    size="sm"
                    className="hover:text-error"
                >
                    Disconnect
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4 relative">
            <Button
                onClick={connect}
                isLoading={isConnecting}
                size="md"
            >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>

            {error && (
                <div className="absolute top-14 right-0 w-80 p-4 rounded-[2px] bg-surface border border-error z-50">
                    <div className="flex items-start gap-3">
                        <div className="flex-1">
                            <h4 className="font-semibold text-text-primary text-sm mb-1">Connection Failed</h4>
                            <p className="text-xs text-text-secondary leading-relaxed">{error}</p>
                            {error.includes('MetaMask') && error.includes('not') && (
                                <a
                                    href="https://metamask.io/download/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-block text-xs font-medium text-accent hover:underline"
                                >
                                    Download MetaMask ↗
                                </a>
                            )}
                            {error.includes('timeout') && (
                                <p className="mt-2 text-xs text-text-secondary">
                                    Tip: Install MetaMask for easier desktop connection
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
