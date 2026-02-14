/**
 * Unit tests for TransactionSyncService
 * 
 * Tests cover:
 * - Transaction sync with mocked blockchain service
 * - Duplicate transaction prevention
 * - Concurrent sync rejection
 * - Error handling for failed wallets
 * - Transaction classification logic
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import {
  TransactionSyncService,
  RawTransaction,
  BlockchainServiceInterface,
} from '../services/transactionSync.service';
import { PriceFetchingService } from '../services/priceFetching.service';
import { CostBasisCalculator } from '../services/costBasisCalculator';
import { Decimal } from '../utils/decimal';

const prisma = new PrismaClient();

// Mock blockchain service
class MockBlockchainService implements BlockchainServiceInterface {
  private mockTransactions: Map<string, RawTransaction[]> = new Map();

  setMockTransactions(key: string, transactions: RawTransaction[]): void {
    this.mockTransactions.set(key, transactions);
  }

  async getTransactions(
    walletAddress: string,
    chain: string
  ): Promise<RawTransaction[]> {
    const key = `${walletAddress}:${chain}`;
    return this.mockTransactions.get(key) || [];
  }
}

// Mock price service
class MockPriceService extends PriceFetchingService {
  private mockPrices: Map<string, Decimal> = new Map();

  setMockPrice(symbol: string, price: Decimal): void {
    this.mockPrices.set(symbol.toUpperCase(), price);
  }

  async getHistoricalPrice(
    tokenSymbol: string,
    timestamp: Date
  ): Promise<Decimal | null> {
    return this.mockPrices.get(tokenSymbol.toUpperCase()) || new Decimal(100);
  }

  async getCurrentPrice(tokenSymbol: string): Promise<Decimal | null> {
    return this.mockPrices.get(tokenSymbol.toUpperCase()) || new Decimal(100);
  }
}

describe('TransactionSyncService', () => {
  let syncService: TransactionSyncService;
  let mockBlockchainService: MockBlockchainService;
  let mockPriceService: MockPriceService;
  let costBasisCalculator: CostBasisCalculator;
  let testUserId: string;
  let testWalletAddress: string;

  beforeEach(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        mainAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
        costBasisMethod: 'FIFO',
      },
    });
    testUserId = user.id;

    // Create test wallet
    const wallet = await prisma.wallet.create({
      data: {
        userId: testUserId,
        address: `0x${Math.random().toString(16).slice(2, 42)}`,
        provider: 'metamask',
        chainTypes: ['ethereum'],
      },
    });
    testWalletAddress = wallet.address;

    // Initialize services
    mockBlockchainService = new MockBlockchainService();
    mockPriceService = new MockPriceService();
    costBasisCalculator = new CostBasisCalculator(prisma);
    syncService = new TransactionSyncService(
      prisma,
      mockPriceService,
      costBasisCalculator,
      mockBlockchainService
    );
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.pnLTransaction.deleteMany({ where: { userId: testUserId } });
    await prisma.holding.deleteMany({ where: { userId: testUserId } });
    await prisma.wallet.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  describe('syncWalletTransactions', () => {
    it('should sync transactions from blockchain service', async () => {
      // Arrange
      const mockTx: RawTransaction = {
        hash: '0xabc123',
        from: '0xsender',
        to: testWalletAddress,
        value: '1.5',
        tokenSymbol: 'ETH',
        timestamp: new Date(),
        chain: 'ethereum',
      };

      mockBlockchainService.setMockTransactions(
        `${testWalletAddress}:ethereum`,
        [mockTx]
      );
      mockPriceService.setMockPrice('ETH', new Decimal(2000));

      // Act
      const result = await syncService.syncWalletTransactions(
        testUserId,
        testWalletAddress,
        'ethereum'
      );

      // Assert
      expect(result.newTransactionsCount).toBe(1);

      // Verify transaction was stored
      const stored = await prisma.pnLTransaction.findFirst({
        where: { userId: testUserId, txHash: '0xabc123' },
      });
      expect(stored).toBeTruthy();
      expect(stored?.tokenSymbol).toBe('ETH');
      expect(stored?.txType).toBe('buy');
    });

    it('should prevent duplicate transactions', async () => {
      // Arrange
      const mockTx: RawTransaction = {
        hash: '0xdup123',
        from: '0xsender',
        to: testWalletAddress,
        value: '1.0',
        tokenSymbol: 'ETH',
        timestamp: new Date(),
        chain: 'ethereum',
      };

      mockBlockchainService.setMockTransactions(
        `${testWalletAddress}:ethereum`,
        [mockTx]
      );

      // Act - First sync
      const result1 = await syncService.syncWalletTransactions(
        testUserId,
        testWalletAddress,
        'ethereum'
      );

      // Act - Second sync with same transaction
      const result2 = await syncService.syncWalletTransactions(
        testUserId,
        testWalletAddress,
        'ethereum'
      );

      // Assert
      expect(result1.newTransactionsCount).toBe(1);
      expect(result2.newTransactionsCount).toBe(0); // Duplicate prevented

      // Verify only one transaction exists
      const count = await prisma.pnLTransaction.count({
        where: { userId: testUserId, txHash: '0xdup123' },
      });
      expect(count).toBe(1);
    });

    it('should reject concurrent sync for same wallet', async () => {
      // Arrange
      const mockTx: RawTransaction = {
        hash: '0xconcurrent',
        from: '0xsender',
        to: testWalletAddress,
        value: '1.0',
        tokenSymbol: 'ETH',
        timestamp: new Date(),
        chain: 'ethereum',
      };

      mockBlockchainService.setMockTransactions(
        `${testWalletAddress}:ethereum`,
        [mockTx]
      );

      // Act - Start first sync (don't await)
      const sync1Promise = syncService.syncWalletTransactions(
        testUserId,
        testWalletAddress,
        'ethereum'
      );

      // Try to start second sync immediately
      const sync2Promise = syncService.syncWalletTransactions(
        testUserId,
        testWalletAddress,
        'ethereum'
      );

      // Assert
      await expect(sync2Promise).rejects.toThrow('Sync already in progress');

      // Wait for first sync to complete
      await sync1Promise;
    });

    it('should classify transactions correctly', async () => {
      // Arrange - Multiple transaction types
      const mockTransactions: RawTransaction[] = [
        {
          hash: '0xbuy',
          from: '0xsender',
          to: testWalletAddress,
          value: '1.0',
          tokenSymbol: 'ETH',
          timestamp: new Date(),
          chain: 'ethereum',
        },
        {
          hash: '0xsell',
          from: testWalletAddress,
          to: '0xreceiver',
          value: '0.5',
          tokenSymbol: 'ETH',
          timestamp: new Date(),
          chain: 'ethereum',
        },
        {
          hash: '0xfee',
          from: testWalletAddress,
          to: '0xminer',
          value: '0',
          tokenSymbol: 'ETH',
          timestamp: new Date(),
          chain: 'ethereum',
        },
        {
          hash: '0xtransfer',
          from: testWalletAddress,
          to: testWalletAddress,
          value: '1.0',
          tokenSymbol: 'ETH',
          timestamp: new Date(),
          chain: 'ethereum',
        },
      ];

      mockBlockchainService.setMockTransactions(
        `${testWalletAddress}:ethereum`,
        mockTransactions
      );

      // Act
      const result = await syncService.syncWalletTransactions(
        testUserId,
        testWalletAddress,
        'ethereum'
      );

      // Assert
      expect(result.newTransactionsCount).toBe(4);

      // Verify classifications
      const buyTx = await prisma.pnLTransaction.findFirst({
        where: { txHash: '0xbuy' },
      });
      expect(buyTx?.txType).toBe('buy');

      const sellTx = await prisma.pnLTransaction.findFirst({
        where: { txHash: '0xsell' },
      });
      expect(sellTx?.txType).toBe('sell');

      const feeTx = await prisma.pnLTransaction.findFirst({
        where: { txHash: '0xfee' },
      });
      expect(feeTx?.txType).toBe('fee');

      const transferTx = await prisma.pnLTransaction.findFirst({
        where: { txHash: '0xtransfer' },
      });
      expect(transferTx?.txType).toBe('transfer');
    });

    it('should handle transactions with fees', async () => {
      // Arrange
      const mockTx: RawTransaction = {
        hash: '0xwithfee',
        from: testWalletAddress,
        to: '0xreceiver',
        value: '1.0',
        tokenSymbol: 'ETH',
        timestamp: new Date(),
        chain: 'ethereum',
        fee: '0.001',
        feeToken: 'ETH',
      };

      mockBlockchainService.setMockTransactions(
        `${testWalletAddress}:ethereum`,
        [mockTx]
      );

      // Act
      const result = await syncService.syncWalletTransactions(
        testUserId,
        testWalletAddress,
        'ethereum'
      );

      // Assert
      expect(result.newTransactionsCount).toBe(1);

      const stored = await prisma.pnLTransaction.findFirst({
        where: { txHash: '0xwithfee' },
      });
      expect(stored?.feeAmount).toBeTruthy();
      expect(stored?.feeToken).toBe('ETH');
    });
  });

  describe('syncAllWallets', () => {
    it('should sync multiple wallets', async () => {
      // Arrange - Create second wallet
      const wallet2 = await prisma.wallet.create({
        data: {
          userId: testUserId,
          address: `0x${Math.random().toString(16).slice(2, 42)}`,
          provider: 'metamask',
          chainTypes: ['ethereum'],
        },
      });

      // Mock transactions for both wallets
      mockBlockchainService.setMockTransactions(
        `${testWalletAddress}:ethereum`,
        [
          {
            hash: '0xwallet1',
            from: '0xsender',
            to: testWalletAddress,
            value: '1.0',
            tokenSymbol: 'ETH',
            timestamp: new Date(),
            chain: 'ethereum',
          },
        ]
      );

      mockBlockchainService.setMockTransactions(`${wallet2.address}:ethereum`, [
        {
          hash: '0xwallet2',
          from: '0xsender',
          to: wallet2.address,
          value: '2.0',
          tokenSymbol: 'ETH',
          timestamp: new Date(),
          chain: 'ethereum',
        },
      ]);

      // Act
      const result = await syncService.syncAllWallets(testUserId);

      // Assert
      expect(result.newTransactionsCount).toBe(2);

      // Clean up
      await prisma.wallet.delete({ where: { id: wallet2.id } });
    });

    it('should continue syncing if one wallet fails', async () => {
      // Arrange - Create second wallet
      const wallet2 = await prisma.wallet.create({
        data: {
          userId: testUserId,
          address: `0x${Math.random().toString(16).slice(2, 42)}`,
          provider: 'metamask',
          chainTypes: ['ethereum'],
        },
      });

      // Mock successful transaction for first wallet
      mockBlockchainService.setMockTransactions(
        `${testWalletAddress}:ethereum`,
        [
          {
            hash: '0xsuccess',
            from: '0xsender',
            to: testWalletAddress,
            value: '1.0',
            tokenSymbol: 'ETH',
            timestamp: new Date(),
            chain: 'ethereum',
          },
        ]
      );

      // Second wallet will have no transactions, so it won't fail
      // Instead, let's create a scenario where the blockchain service throws an error
      // We'll override the getTransactions method for this specific test
      const originalGetTransactions = mockBlockchainService.getTransactions.bind(mockBlockchainService);
      mockBlockchainService.getTransactions = async (walletAddress: string, chain: string) => {
        if (walletAddress === wallet2.address) {
          throw new Error('Blockchain service error');
        }
        return originalGetTransactions(walletAddress, chain);
      };

      // Act
      const result = await syncService.syncAllWallets(testUserId);

      // Assert
      expect(result.newTransactionsCount).toBeGreaterThanOrEqual(1);
      // Should have at least one error
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);

      // Restore original method
      mockBlockchainService.getTransactions = originalGetTransactions;

      // Clean up
      await prisma.wallet.delete({ where: { id: wallet2.id } });
    });

    it('should filter by specific wallet addresses', async () => {
      // Arrange - Create second wallet
      const wallet2 = await prisma.wallet.create({
        data: {
          userId: testUserId,
          address: `0x${Math.random().toString(16).slice(2, 42)}`,
          provider: 'metamask',
          chainTypes: ['ethereum'],
        },
      });

      // Mock transactions for both wallets
      mockBlockchainService.setMockTransactions(
        `${testWalletAddress}:ethereum`,
        [
          {
            hash: '0xfiltered',
            from: '0xsender',
            to: testWalletAddress,
            value: '1.0',
            tokenSymbol: 'ETH',
            timestamp: new Date(),
            chain: 'ethereum',
          },
        ]
      );

      mockBlockchainService.setMockTransactions(`${wallet2.address}:ethereum`, [
        {
          hash: '0xnotsynced',
          from: '0xsender',
          to: wallet2.address,
          value: '2.0',
          tokenSymbol: 'ETH',
          timestamp: new Date(),
          chain: 'ethereum',
        },
      ]);

      // Act - Sync only first wallet
      const result = await syncService.syncAllWallets(testUserId, [
        testWalletAddress,
      ]);

      // Assert
      expect(result.newTransactionsCount).toBe(1);

      // Verify only first wallet's transaction was synced
      const tx1 = await prisma.pnLTransaction.findFirst({
        where: { txHash: '0xfiltered' },
      });
      expect(tx1).toBeTruthy();

      const tx2 = await prisma.pnLTransaction.findFirst({
        where: { txHash: '0xnotsynced' },
      });
      expect(tx2).toBeNull();

      // Clean up
      await prisma.wallet.delete({ where: { id: wallet2.id } });
    });
  });

  describe('isSyncInProgress', () => {
    it('should return true when sync is in progress', async () => {
      // Arrange
      mockBlockchainService.setMockTransactions(
        `${testWalletAddress}:ethereum`,
        [
          {
            hash: '0xprogress',
            from: '0xsender',
            to: testWalletAddress,
            value: '1.0',
            tokenSymbol: 'ETH',
            timestamp: new Date(),
            chain: 'ethereum',
          },
        ]
      );

      // Act - Start sync (don't await)
      const syncPromise = syncService.syncWalletTransactions(
        testUserId,
        testWalletAddress,
        'ethereum'
      );

      // Check if in progress
      const inProgress = syncService.isSyncInProgress(
        testWalletAddress,
        'ethereum'
      );

      // Assert
      expect(inProgress).toBe(true);

      // Wait for sync to complete
      await syncPromise;

      // Should no longer be in progress
      const stillInProgress = syncService.isSyncInProgress(
        testWalletAddress,
        'ethereum'
      );
      expect(stillInProgress).toBe(false);
    });
  });

  describe('getActiveSyncs', () => {
    it('should return list of active syncs', async () => {
      // Arrange
      mockBlockchainService.setMockTransactions(
        `${testWalletAddress}:ethereum`,
        [
          {
            hash: '0xactive',
            from: '0xsender',
            to: testWalletAddress,
            value: '1.0',
            tokenSymbol: 'ETH',
            timestamp: new Date(),
            chain: 'ethereum',
          },
        ]
      );

      // Act - Start sync (don't await)
      const syncPromise = syncService.syncWalletTransactions(
        testUserId,
        testWalletAddress,
        'ethereum'
      );

      // Get active syncs
      const activeSyncs = syncService.getActiveSyncs();

      // Assert
      expect(activeSyncs).toContain(`${testWalletAddress}:ethereum`);

      // Wait for sync to complete
      await syncPromise;

      // Should be empty now
      const noActiveSyncs = syncService.getActiveSyncs();
      expect(noActiveSyncs).toHaveLength(0);
    });
  });
});
