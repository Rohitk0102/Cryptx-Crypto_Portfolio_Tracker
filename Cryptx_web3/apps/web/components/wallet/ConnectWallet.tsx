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
            <div className="flex items-center gap-4 bg-white/5 pl-4 p-1 rounded-xl border border-white/10 backdrop-blur-md">
                <div className="flex flex-col items-end">
                    <span className="text-sm font-bold text-white tracking-wide">
                        {user.address.slice(0, 6)}...{user.address.slice(-4)}
                    </span>
                    <span className="text-[10px] text-green-400 font-medium uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Connected
                    </span>
                </div>
                <Button
                    onClick={disconnect}
                    variant="ghost"
                    size="sm"
                    className="hover:bg-red-500/10 hover:text-red-400"
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
                className="shadow-xl"
            >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>

            {error && (
                <div className="absolute top-14 right-0 w-80 p-4 rounded-xl glass border-l-4 border-l-red-500 animate-[slideIn_0.3s_ease-out] z-50">
                    <div className="flex items-start gap-3">
                        <span className="text-xl">⚠️</span>
                        <div className="flex-1">
                            <h4 className="font-bold text-white text-sm">Connection Failed</h4>
                            <p className="text-xs text-gray-300 mt-1 leading-relaxed">{error}</p>
                            {error.includes('MetaMask') && error.includes('not') && (
                                <a
                                    href="https://metamask.io/download/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 inline-block text-xs font-bold text-primary hover:text-primary-foreground hover:underline transition-colors"
                                >
                                    Download MetaMask ↗
                                </a>
                            )}
                            {error.includes('timeout') && (
                                <p className="mt-2 text-xs text-gray-400">
                                    💡 Tip: Install MetaMask for easier desktop connection
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
