import prisma from '../utils/prisma';
import { getMultiChainBalances, ChainBalance } from './blockchain.service';
import { getTokenPrice, calculateUsdValue } from './price.service';
import { validateWalletChainTypes, sanitizeChainTypes } from '../utils/chainValidation';

export interface AssetSummary {
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

export interface PortfolioData {
    totalValueUsd: number;
    wallets: {
        id: string;
        address: string;
        nickname?: string;
        provider?: string;
        valueUsd: number;
        chains: ChainBalance[];
    }[];
    assets: AssetSummary[];
    lastUpdated: Date;
}

/**
 * Aggregate portfolio for a user
 */
export async function aggregatePortfolio(userId: string): Promise<PortfolioData> {
    // Get all user wallets
    const wallets = await prisma.wallet.findMany({
        where: { userId, isActive: true },
    });

    if (wallets.length === 0) {
        return {
            totalValueUsd: 0,
            wallets: [],
            assets: [],
            lastUpdated: new Date(),
        };
    }

    const walletData = [];
    const assetMap = new Map<string, AssetSummary>();

    for (const wallet of wallets) {
        // Validate and sanitize chain types
        const chainValidation = validateWalletChainTypes(wallet.chainTypes);
        if (!chainValidation.isValid) {
            console.warn(`Invalid chain types for wallet ${wallet.address}:`, chainValidation.errors);
            // Skip this wallet or use only valid chains
            continue;
        }

        const sanitizedChains = sanitizeChainTypes(wallet.chainTypes);
        
        // Fetch balances for this wallet (token discovery is now integrated)
        const chainBalances = await getMultiChainBalances(
            wallet.address,
            sanitizedChains
        );

        let walletTotalUsd = 0;

        // Calculate USD values
        for (const chainBalance of chainBalances) {
            // Native token
            const nativePrice = await getTokenPrice(chainBalance.nativeBalance.symbol);
            if (nativePrice) {
                const valueUsd = calculateUsdValue(
                    chainBalance.nativeBalance.balance,
                    nativePrice.priceUsd
                );
                chainBalance.nativeBalance.valueUsd = valueUsd;
                walletTotalUsd += valueUsd;

                // Add to asset map
                const symbol = chainBalance.nativeBalance.symbol;
                if (!assetMap.has(symbol)) {
                    assetMap.set(symbol, {
                        symbol,
                        name: chainBalance.nativeBalance.name,
                        totalBalance: '0',
                        valueUsd: 0,
                        chains: [],
                    });
                }
                const asset = assetMap.get(symbol)!;
                asset.totalBalance = (
                    parseFloat(asset.totalBalance) +
                    parseFloat(chainBalance.nativeBalance.balance)
                ).toString();
                asset.valueUsd += valueUsd;
                asset.chains.push({
                    chain: chainBalance.chain,
                    balance: chainBalance.nativeBalance.balance,
                    valueUsd,
                });
            }

            // ERC-20 tokens
            for (const token of chainBalance.tokens) {
                const tokenPrice = await getTokenPrice(token.symbol);
                if (tokenPrice) {
                    const valueUsd = calculateUsdValue(token.balance, tokenPrice.priceUsd);
                    token.valueUsd = valueUsd;
                    walletTotalUsd += valueUsd;

                    // Add to asset map
                    if (!assetMap.has(token.symbol)) {
                        assetMap.set(token.symbol, {
                            symbol: token.symbol,
                            name: token.name,
                            totalBalance: '0',
                            valueUsd: 0,
                            chains: [],
                        });
                    }
                    const asset = assetMap.get(token.symbol)!;
                    asset.totalBalance = (
                        parseFloat(asset.totalBalance) + parseFloat(token.balance)
                    ).toString();
                    asset.valueUsd += valueUsd;
                    asset.chains.push({
                        chain: chainBalance.chain,
                        balance: token.balance,
                        valueUsd,
                    });
                }
            }

            chainBalance.totalValueUsd = walletTotalUsd;
        }

        walletData.push({
            id: wallet.id,
            address: wallet.address,
            nickname: wallet.nickname || undefined,
            provider: wallet.provider || undefined,
            valueUsd: walletTotalUsd,
            chains: chainBalances,
        });
    }

    const totalValueUsd = walletData.reduce(
        (sum, wallet) => sum + wallet.valueUsd,
        0
    );

    const assets = Array.from(assetMap.values()).sort(
        (a, b) => b.valueUsd - a.valueUsd
    );

    return {
        totalValueUsd,
        wallets: walletData,
        assets,
        lastUpdated: new Date(),
    };
}

/**
 * Generate and save portfolio snapshot
 */
export async function generateSnapshot(userId: string): Promise<void> {
    const portfolio = await aggregatePortfolio(userId);

    await prisma.portfolioSnapshot.create({
        data: {
            userId,
            totalValueUsd: portfolio.totalValueUsd,
            breakdown: portfolio as any,
        },
    });
}

/**
 * Get latest snapshot
 */
export async function getLatestSnapshot(userId: string) {
    return await prisma.portfolioSnapshot.findFirst({
        where: { userId },
        orderBy: { generatedAt: 'desc' },
    });
}
