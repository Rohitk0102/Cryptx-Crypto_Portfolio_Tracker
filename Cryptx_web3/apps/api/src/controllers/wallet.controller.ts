import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { getMultiChainBalances } from '../services/blockchain.service';
import { validateWalletData, sanitizeChainTypes } from '../utils/chainValidation';

/**
 * Add a new wallet for the user
 */
export const addWallet = async (req: AuthRequest, res: Response) => {
    try {
        const { address, provider, chainTypes, nickname } = req.body;
        const userId = req.userId!;

        console.log('📥 Add wallet request:', {
            userId,
            address,
            provider,
            chainTypes,
            nickname,
        });

        if (!address || !provider) {
            console.log('❌ Missing required fields');
            return res.status(400).json({ error: 'Address and provider are required' });
        }

        // Validate wallet data
        const validation = validateWalletData({
            address,
            chainTypes: chainTypes || ['ethereum', 'polygon', 'bsc'],
            provider,
        });

        console.log('🔍 Validation result:', validation);

        if (!validation.isValid) {
            console.log('❌ Validation failed:', validation.errors);
            return res.status(400).json({ 
                error: 'Invalid wallet data', 
                details: validation.errors 
            });
        }

        // Normalize address and sanitize chain types
        const normalizedAddress = address.toLowerCase();
        const sanitizedChains = sanitizeChainTypes(chainTypes || ['ethereum', 'polygon', 'bsc']);

        // Check if wallet already exists
        const existing = await prisma.wallet.findUnique({
            where: {
                userId_address: {
                    userId,
                    address: normalizedAddress,
                },
            },
        });

        if (existing) {
            console.log('❌ Wallet already exists');
            return res.status(400).json({ 
                error: 'This wallet is already connected to your account',
                code: 'WALLET_ALREADY_EXISTS'
            });
        }

        // Create wallet
        const wallet = await prisma.wallet.create({
            data: {
                userId,
                address: normalizedAddress,
                provider,
                chainTypes: sanitizedChains,
                nickname,
            },
        });

        res.status(201).json(wallet);
    } catch (error) {
        console.error('Error adding wallet:', error);
        res.status(500).json({ error: 'Failed to add wallet' });
    }
};

/**
 * Get all wallets for the user
 */
export const getWallets = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;

        const wallets = await prisma.wallet.findMany({
            where: { userId, isActive: true },
            orderBy: { createdAt: 'desc' },
        });

        res.json(wallets);
    } catch (error) {
        console.error('Error fetching wallets:', error);
        res.status(500).json({ error: 'Failed to fetch wallets' });
    }
};

/**
 * Delete a wallet
 */
export const deleteWallet = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        // Verify ownership
        const wallet = await prisma.wallet.findFirst({
            where: { id: id as string, userId },
        });

        if (!wallet || wallet.userId !== userId) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        // Soft delete
        await prisma.wallet.update({
            where: { id: id as string },
            data: { isActive: false },
        });

        res.json({ message: 'Wallet removed successfully' });
    } catch (error) {
        console.error('Error deleting wallet:', error);
        res.status(500).json({ error: 'Failed to delete wallet' });
    }
};

/**
 * Get wallet balances
 */
export const getWalletBalances = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.userId!;

        // Verify ownership
        const wallet = await prisma.wallet.findFirst({
            where: { id: id as string, userId },
        });

        if (!wallet || wallet.userId !== userId) {
            return res.status(404).json({ error: 'Wallet not found' });
        }

        // Validate and sanitize chain types
        const chainValidation = validateWalletData({
            address: wallet.address,
            chainTypes: wallet.chainTypes,
            provider: wallet.provider,
        });

        if (!chainValidation.isValid) {
            return res.status(400).json({ 
                error: 'Invalid wallet configuration', 
                details: chainValidation.errors 
            });
        }

        const sanitizedChains = sanitizeChainTypes(wallet.chainTypes);

        // Fetch balances across chains (token discovery is now integrated)
        const balances = await getMultiChainBalances(
            wallet.address,
            sanitizedChains
        );

        res.json({
            wallet: {
                id: wallet.id,
                address: wallet.address,
                nickname: wallet.nickname,
                chainTypes: sanitizedChains,
            },
            balances,
        });
    } catch (error) {
        console.error('Error fetching balances:', error);
        res.status(500).json({ error: 'Failed to fetch balances' });
    }
};
