import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { connectWallet, signInWithEthereum, disconnectWallet } from '@/lib/web3/wallet';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export const useWalletConnect = () => {
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string>('');
    const [connection, setConnection] = useState<any>(null);
    const { setAuth, clearAuth } = useAuthStore();
    const router = useRouter();

    const connect = async () => {
        setIsConnecting(true);
        setError('');

        try {
            // Step 1: Connect to wallet (auto-detects MetaMask or WalletConnect)
            const walletConnection = await connectWallet();
            setConnection(walletConnection);
            console.log('Connected to:', walletConnection.address, 'via', walletConnection.providerType);

            // Step 2: Get nonce from backend
            const { nonce } = await authApi.getNonce();

            // Step 3: Sign SIWE message
            const { message, signature } = await signInWithEthereum(
                walletConnection,
                walletConnection.address,
                nonce
            );

            // Step 4: Verify signature with backend
            const authResponse = await authApi.verifySignature(message, signature);

            // Step 5: Store tokens and user info
            setAuth(
                {
                    accessToken: authResponse.accessToken,
                    refreshToken: authResponse.refreshToken,
                },
                authResponse.user
            );

            console.log('✅ Authentication successful!');

            // Navigate to dashboard
            router.push('/dashboard');
            return true;
            return true;
        } catch (err: any) {
            console.error('Connection error:', err);

            if (err.code === 'METAMASK_NOT_INSTALLED' || err.message?.includes('MetaMask is not installed')) {
                setError('MetaMask not detected. Please install the MetaMask extension to continue.');
            } else {
                setError(err.message || 'Failed to connect wallet');
            }

            return false;
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnect = async () => {
        try {
            // Disconnect from WalletConnect if applicable
            if (connection) {
                await disconnectWallet(connection);
                setConnection(null);
            }

            // Logout from backend
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await authApi.logout(refreshToken);
            }

            clearAuth();
        } catch (error) {
            console.error('Logout error:', error);
            clearAuth();
        }
    };

    return {
        isConnecting,
        error,
        connect,
        disconnect
    };
};
