/**
 * Unit Tests for P&L Calculation Engine
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { PnLCalculationEngine } from '../services/pnlCalculationEngine';
import { CostBasisCalculator } from '../services/costBasisCalculator';
import { PriceFetchingService } from '../services/priceFetching.service';
import { Decimal } from '../utils/decimal';

const prisma = new PrismaClient();

describe('PnLCalculationEngine', () => {
  let costBasisCalculator: CostBasisCalculator;
  let priceService: PriceFetchingService;
  let engine: PnLCalculationEngine;
  let testUserId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        mainAddress: `test-${Date.now()}-${Math.random()}`,
        costBasisMethod: 'FIFO'
      }
    });
    testUserId = user.id;

    costBasisCalculator = new CostBasisCalculator(prisma);
    priceService = new PriceFetchingService();
    engine = new PnLCalculationEngine(prisma, costBasisCalculator, priceService);
  });

  afterEach(async () => {
    await prisma.realizedPnL.deleteMany({ where: { userId: testUserId } });
    await prisma.holding.deleteMany({ where: { userId: testUserId } });
    await prisma.pnLTransaction.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  describe('calculateRealizedPnL', () => {
    it('should calculate realized P&L for a simple buy-sell sequence', async () => {
      const tokenSymbol = 'ETH';
      const baseTime = new Date('2024-01-01T00:00:00Z');

      await prisma.pnLTransaction.create({
        data: {
          userId: testUserId,
          walletAddress: '0xabc',
          chain: 'ethereum',
          tokenSymbol,
          txType: 'buy',
          quantity: '1.0',
          priceUsd: '1500',
          timestamp: new Date(baseTime.getTime()),
          txHash: '0x111',
          source: 'wallet'
        }
      });

      await prisma.pnLTransaction.create({
        data: {
          userId: testUserId,
          walletAddress: '0xabc',
          chain: 'ethereum',
          tokenSymbol,
          txType: 'sell',
          quantity: '1.0',
          priceUsd: '2000',
          feeAmount: '0.01',
          feeToken: 'ETH',
          timestamp: new Date(baseTime.getTime() + 86400000),
          txHash: '0x222',
          source: 'wallet'
        }
      });

      const result = await engine.calculateRealizedPnL(testUserId);

      expect(result.totalRealizedPnL.toString()).toBe('480');
      expect(result.byToken).toHaveLength(1);
      expect(result.byToken[0].tokenSymbol).toBe('ETH');
      expect(result.byToken[0].realizedPnL.toString()).toBe('480');
      expect(result.byToken[0].transactionCount).toBe(1);

      const pnlRecords = await prisma.realizedPnL.findMany({
        where: { userId: testUserId }
      });
      expect(pnlRecords).toHaveLength(1);
      expect(pnlRecords[0].realizedAmountUsd.toString()).toBe('480');
    });
  });
});
