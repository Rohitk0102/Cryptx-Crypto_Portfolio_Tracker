'use client';

import { useState } from 'react';
import { connectWallet, connectMetaMask, connectWalletConnectProvider, connectCoinbase } from '@/lib/web3/wallet';
import apiClient from '@/lib/api';

interface AddWalletModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AddWalletModal({ isOpen, onClose, onSuccess }: AddWalletModalProps) {
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [nickname, setNickname] = useState('');
    const [selectedChains, setSelectedChains] = useState<string[]>(['ethereum', 'polygon', 'bsc']);

    if (!isOpen) return null;

    const chains = [
        { id: 'ethereum', name: 'Ethereum', icon: '⟠' },
        { id: 'polygon', name: 'Polygon', icon: '⬡' },
        { id: 'bsc', name: 'BSC', icon: '◆' },
    ];

    const toggleChain = (chainId: string) => {
        setSelectedChains(prev =>
            prev.includes(chainId)
                ? prev.filter(c => c !== chainId)
                : [...prev, chainId]
        );
    };

    const handleConnect = async (providerType: 'auto' | 'metamask' | 'walletconnect' | 'coinbase') => {
        setIsConnecting(true);
        setError('');

        try {
            let walletConnection;

            // Connect based on provider type
            if (providerType === 'metamask') {
                walletConnection = await connectMetaMask();
            } else if (providerType === 'walletconnect') {
                walletConnection = await connectWalletConnectProvider();
            } else if (providerType === 'coinbase') {
                walletConnection = await connectCoinbase();
            } else {
                walletConnection = await connectWallet(); // Auto-detect
            }

            console.log('✅ Wallet connected:', walletConnection.address);
            console.log('Provider type:', walletConnection.providerType);
            console.log('Selected chains:', selectedChains);
            console.log('Nickname:', nickname);

            // Prepare wallet data
            const walletData = {
                address: walletConnection.address,
                provider: walletConnection.providerType,
                chainTypes: selectedChains,
                nickname: nickname || undefined,
            };

            console.log('📤 Sending to API:', walletData);

            // Add wallet to backend
            const response = await apiClient.post('/wallets', walletData);

            console.log('✅ Wallet added to backend:', response.data);
            
            // Success!
            setSuccess('Wallet connected successfully!');
            setTimeout(() => {
                onSuccess();
                onClose();
                setNickname('');
                setSelectedChains(['ethereum', 'polygon', 'bsc']);
                setSuccess('');
            }, 1500);
        } catch (err: any) {
            console.error('❌ Error adding wallet:', err);
            
            if (err.response?.data?.error) {
                const errorMsg = err.response.data.error;
                const errorCode = err.response.data.code;
                
                // Handle specific error codes
                if (errorCode === 'WALLET_ALREADY_EXISTS') {
                    setError('This wallet is already connected to your account. Please use a different wallet.');
                } else {
                    setError(errorMsg);
                }
            } else if (err.response?.data?.details) {
                // Show validation details
                const details = err.response.data.details;
                setError(`Validation error: ${details.join(', ')}`);
            } else if (err.code === 'METAMASK_NOT_INSTALLED') {
                setError('MetaMask not detected. Please install MetaMask extension.');
            } else if (err.message?.includes('User rejected')) {
                setError('Connection rejected. Please approve the connection in your wallet.');
            } else if (err.message?.includes('timeout')) {
                setError('Connection timeout. Please try again.');
            } else {
                setError(err.message || 'Failed to connect wallet. Please try again.');
            }
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl shadow-2xl">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition text-gray-400 hover:text-white"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="p-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Link New Wallet</h2>
                    <p className="text-sm text-gray-400 mb-6">
                        Connect an additional wallet to track your complete portfolio
                    </p>

                    {success && (
                        <div className="mb-4 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                            <div className="flex items-center gap-3">
                                <span className="text-green-400 text-lg">✅</span>
                                <div className="text-green-400 text-sm font-medium">{success}</div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                            <div className="flex items-start gap-3">
                                <span className="text-red-400 text-lg">⚠️</span>
                                <div className="flex-1">
                                    <div className="text-red-400 text-sm font-medium mb-1">Connection Error</div>
                                    <div className="text-red-300 text-xs">{error}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Nickname */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Wallet Nickname (Optional)
                        </label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="e.g., Trading Wallet, Cold Storage"
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-primary/50 transition"
                        />
                    </div>

                    {/* Chain Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            Select Chains to Track
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {chains.map((chain) => (
                                <button
                                    key={chain.id}
                                    onClick={() => toggleChain(chain.id)}
                                    className={`p-3 rounded-lg border transition ${
                                        selectedChains.includes(chain.id)
                                            ? 'bg-primary/20 border-primary text-white'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{chain.icon}</span>
                                        <span className="text-sm font-medium">{chain.name}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Wallet Options */}
                    <div className="space-y-3">
                        <button
                            onClick={() => handleConnect('metamask')}
                            disabled={isConnecting}
                            className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 transition flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🦊</span>
                                <div className="text-left">
                                    <div className="text-white font-medium">MetaMask</div>
                                    <div className="text-xs text-gray-400">Browser Extension</div>
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-primary transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        <button
                            onClick={() => handleConnect('coinbase')}
                            disabled={isConnecting}
                            className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 transition flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🔵</span>
                                <div className="text-left">
                                    <div className="text-white font-medium">Coinbase Wallet</div>
                                    <div className="text-xs text-gray-400">Browser Extension</div>
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-gray-400 group-hover:text-primary transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        <button
                            onClick={() => handleConnect('walletconnect')}
                            disabled={isConnecting}
                            className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 transition flex items-center justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">📱</span>
                                <div className="text-left">
                                    <div className="text-white font-medium">WalletConnect</div>
                                    <div className="text-xs text-gray-400">
                                        {isConnecting ? 'Scan QR code in your wallet...' : 'Mobile Wallets'}
                                    </div>
                                </div>
                            </div>
                            {isConnecting ? (
                                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <svg className="w-5 h-5 text-gray-400 group-hover:text-primary transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            )}
                        </button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-2 bg-gray-900 text-gray-500">OR</span>
                            </div>
                        </div>

                        <button
                            onClick={() => handleConnect('auto')}
                            disabled={isConnecting}
                            className="w-full p-4 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/50 transition text-primary font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isConnecting ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    <span>Connecting...</span>
                                </div>
                            ) : (
                                'Auto-Detect Wallet'
                            )}
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 mt-4 text-center">
                        Connect multiple wallets to see your complete portfolio
                    </p>
                </div>
            </div>
        </div>
    );
}
