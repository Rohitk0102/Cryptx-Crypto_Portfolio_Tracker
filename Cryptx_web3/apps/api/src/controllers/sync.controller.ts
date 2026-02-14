import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../utils/prisma';
import { TransactionSyncService } from '../services/transactionSync.service';
import { PriceFetchingService } from '../services/priceFetching.service';
import { CostBasisCalculator } from '../services/costBasisCalculator';

// Initialize services
const priceService = new PriceFetchingService();
const costBasisCalculator = new CostBasisCalculator(prisma);
const syncService = new TransactionSyncService(prisma, priceService, costBasisCalculator);

/**
 * Sync transactions from wallets
 * POST /api/transactions/sync
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */
export const syncTransactions = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;
        
        // Parse optional wallet filter
        const walletAddresses = req.body.walletAddresses as string[] | undefined;

        // Validate wallet addresses if provided
        if (walletAddresses) {
            if (!Array.isArray(walletAddresses)) {
                return res.status(400).json({
                    error: 'Invalid walletAddresses format',
                    details: 'walletAddresses must be an array of strings',
                });
            }

            // Verify all wallets belong to the user
            const userWallets = await prisma.wallet.findMany({
                where: {
                    userId,
                    address: { in: walletAddresses },
                },
                select: { address: true },
            });

            const userWalletAddresses = userWallets.map(w => w.address);
            const invalidAddresses = walletAddresses.filter(
                addr => !userWalletAddresses.includes(addr)
            );

            if (invalidAddresses.length > 0) {
                return res.status(403).json({
                    error: 'Unauthorized wallet addresses',
                    details: `The following addresses do not belong to you: ${invalidAddresses.join(', ')}`,
                });
            }
        }

        // Perform sync
        const result = await syncService.syncAllWallets(userId, walletAddresses);

        // Return results
        res.json({
            success: true,
            newTransactionsCount: result.newTransactionsCount,
            updatedHoldings: result.updatedHoldings,
            errors: result.errors,
        });
    } catch (error: any) {
        console.error('Error syncing transactions:', error);

        // Handle concurrent sync error
        if (error.message && error.message.includes('already in progress')) {
            return res.status(409).json({
                error: 'Sync already in progress',
                details: error.message,
            });
        }

        res.status(500).json({ error: 'Failed to sync transactions' });
    }
};

/**
 * Get sync status
 * GET /api/transactions/sync/status
 */
export const getSyncStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.userId!;

        // Get user's wallets
        const wallets = await prisma.wallet.findMany({
            where: { userId, isActive: true },
            select: { address: true, chainTypes: true },
        });

        // Check which wallets are currently syncing
        const syncStatus = wallets.flatMap(wallet =>
            wallet.chainTypes.map(chain => ({
                walletAddress: wallet.address,
                chain,
                syncing: syncService.isSyncInProgress(wallet.address, chain),
            }))
        );

        res.json({
            activeSyncs: syncService.getActiveSyncs(),
            walletStatus: syncStatus,
        });
    } catch (error) {
        console.error('Error getting sync status:', error);
        res.status(500).json({ error: 'Failed to get sync status' });
    }
};
