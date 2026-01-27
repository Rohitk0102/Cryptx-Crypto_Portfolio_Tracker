import apiClient from './api';

export interface Asset {
    symbol: string;
    name: string;
    totalBalance: string;
    valueUsd: number;
    chains: {
        chain: string;
        balance: string;
        valueUsd: number;
    }[];
}

export interface WalletData {
    id: string;
    address: string;
    nickname?: string;
    valueUsd: number;
    chains: any[];
}

export interface PortfolioResponse {
    totalValueUsd: number;
    wallets: WalletData[];
    assets: Asset[];
    lastUpdated: string;
    cached?: boolean;
}

export const portfolioApi = {
    getPortfolio: async (cached = false): Promise<PortfolioResponse> => {
        const { data } = await apiClient.get(`/portfolio?cached=${cached}`);
        return data;
    },

    refreshPortfolio: async (): Promise<PortfolioResponse> => {
        const { data } = await apiClient.post('/portfolio/refresh');
        return data;
    },

    getHistory: async (limit = 30) => {
        const { data } = await apiClient.get(`/portfolio/history?limit=${limit}`);
        return data;
    },

    getAllocation: async () => {
        const { data } = await apiClient.get('/portfolio/allocation');
        return data;
    },

    getMetrics: async () => {
        const { data } = await apiClient.get('/portfolio/metrics');
        return data;
    },
};

export interface Wallet {
    id: string;
    address: string;
    provider: string;
    chainTypes: string[];
    nickname?: string;
    isActive: boolean;
    createdAt: string;
}

export const walletApi = {
    addWallet: async (walletData: {
        address: string;
        provider: string;
        chainTypes?: string[];
        nickname?: string;
    }): Promise<Wallet> => {
        const { data } = await apiClient.post('/wallets', walletData);
        return data;
    },

    getWallets: async (): Promise<Wallet[]> => {
        const { data } = await apiClient.get('/wallets');
        return data;
    },

    deleteWallet: async (id: string): Promise<void> => {
        await apiClient.delete(`/wallets/${id}`);
    },

    getWalletBalances: async (id: string) => {
        const { data } = await apiClient.get(`/wallets/${id}/balances`);
        return data;
    },
};
