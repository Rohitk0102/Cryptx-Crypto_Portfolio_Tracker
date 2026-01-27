import { SignClient } from '@walletconnect/sign-client';
import { WalletConnectModal } from '@walletconnect/modal';
import { ethers } from 'ethers';

export interface WalletConnectConnection {
    provider: ethers.JsonRpcProvider;
    address: string;
    chainId: number;
    signClient: SignClient;
    session: any;
}

let signClient: SignClient | null = null;
let modal: WalletConnectModal | null = null;

/**
 * Initialize WalletConnect client
 */
export async function initializeWalletConnect(): Promise<SignClient> {
    if (signClient) {
        return signClient;
    }

    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    if (!projectId) {
        throw new Error('WalletConnect Project ID not found');
    }

    signClient = await SignClient.init({
        projectId,
        metadata: {
            name: 'CryptX Portfolio Tracker',
            description: 'Track your crypto portfolio across multiple chains',
            url: typeof window !== 'undefined' ? window.location.origin : 'https://cryptx.app',
            icons: ['https://cryptx.app/icon.png'],
        },
    });

    return signClient;
}

/**
 * Initialize WalletConnect modal
 */
function initializeModal(): WalletConnectModal {
    if (!modal) {
        const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
        if (!projectId) {
            throw new Error('WalletConnect Project ID not found');
        }

        modal = new WalletConnectModal({
            projectId,
            chains: ['eip155:1', 'eip155:137', 'eip155:56'],
        });
    }
    return modal;
}

/**
 * Connect with WalletConnect
 */
export async function connectWalletConnect(): Promise<WalletConnectConnection> {
    if (!isWalletConnectAvailable()) {
        throw new Error('WalletConnect is not available');
    }

    try {
        const client = await initializeWalletConnect();
        const walletConnectModal = initializeModal();

        // Create pairing proposal
        const { uri, approval } = await client.connect({
            requiredNamespaces: {
                eip155: {
                    methods: [
                        'eth_sign',
                        'eth_signTransaction',
                        'eth_sendTransaction',
                        'eth_signTypedData',
                        'personal_sign',
                        'eth_requestAccounts',
                    ],
                    chains: ['eip155:1', 'eip155:137', 'eip155:56'],
                    events: ['chainChanged', 'accountsChanged'],
                },
            },
        });

        // Open modal for QR code scanning
        if (uri) {
            walletConnectModal.openModal({ uri });
        }

        // Wait for session approval with timeout
        const session = await Promise.race([
            approval(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Connection timeout - please try again')), 60000)
            )
        ]);

        // Close modal after successful connection
        walletConnectModal.closeModal();

        // Get the first account and chain
        const accounts = session.namespaces.eip155.accounts;
        const account = accounts[0]; // eip155:1:0x...
        const [namespace, chainId, address] = account.split(':');

        // Ensure address is checksummed (EIP-55 compliant)
        const checksummedAddress = ethers.getAddress(address);

        // Create ethers provider
        const provider = new ethers.JsonRpcProvider(
            `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
        );

        return {
            provider,
            address: checksummedAddress, // Keep checksummed address (EIP-55 compliant)
            chainId: parseInt(chainId),
            signClient: client,
            session,
        };
    } catch (error) {
        console.error('WalletConnect connection error:', error);
        
        // Make sure modal is closed on error
        if (modal) {
            modal.closeModal();
        }
        
        throw new Error('Failed to connect with WalletConnect. Please try again or use MetaMask.');
    }
}

/**
 * Sign message with WalletConnect
 */
export async function signMessageWithWalletConnect(
    client: SignClient,
    session: any,
    message: string,
    address: string
): Promise<string> {
    try {
        const result = await client.request({
            topic: session.topic,
            chainId: 'eip155:1', // Use Ethereum for signing
            request: {
                method: 'personal_sign',
                params: [message, address],
            },
        });

        return result as string;
    } catch (error) {
        console.error('WalletConnect sign error:', error);
        throw new Error('Failed to sign message with WalletConnect');
    }
}

/**
 * Disconnect WalletConnect session
 */
export async function disconnectWalletConnect(
    client: SignClient,
    session: any
): Promise<void> {
    try {
        await client.disconnect({
            topic: session.topic,
            reason: {
                code: 6000,
                message: 'USER_DISCONNECTED',
            },
        });
    } catch (error) {
        console.error('WalletConnect disconnect error:', error);
    }
}

/**
 * Check if WalletConnect is available
 */
export function isWalletConnectAvailable(): boolean {
    return typeof window !== 'undefined' &&
        !!process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
}
