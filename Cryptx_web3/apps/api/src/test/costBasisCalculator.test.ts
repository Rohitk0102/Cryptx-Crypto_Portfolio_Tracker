/**
 * Unit Tests for Cost Basis Calculator
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { CostBasisCalculator } from '../services/costBasisCalculator';
import { Decimal } from '../utils/decimal';

const prisma = new PrismaClient();

describe('CostBasisCalculator', () => {
  let calculator: CostBasisCalculator;
  let testUserId: string;

  beforeEach(async () => {
    calculator = new CostBasisCalculator(prisma);
    const user = await prisma.user.create({
      data: {
        mainAddress: `test-${Date.now()}-${Math.random()}`,
        costBasisMethod: 'FIFO'
      }
    });
    testUserId = user.id;
  });

  afterEach(async () => {
    await prisma.holding.deleteMany({ where: { userId: testUserId } });
    await prisma.pnLTransaction.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  describe('getCostBasis', () => {
    it('should calculate FIFO cost basis correctly', async () => {
      const baseTime = new Date('2024-01-01T00:00:00Z');
      
      await prisma.pnLTransaction.createMany({
        data: [
          {
            userId: testUserId,
            walletAddress: 'wallet1',
            chain: 'ethereum',
            tokenSymbol: 'ETH',
            txType: 'buy',
            quantity: 10,
            priceUsd: 1000,
            timestamp: new Date(baseTime.getTime()),
            txHash: 'hash1',
            source: 'wallet'
          },
          {
            userId: testUserId,
            walletAddress: 'wallet1',
            chain: 'ethereum',
            tokenSymbol: 'ETH',
            txType: 'buy',
            quantity: 10,
            priceUsd: 1500,
            timestamp: new Date(baseTime.getTime() + 1000),
            txHash: 'hash2',
            source: 'wallet'
          }
        ]
      });

      const sellTime = new Date(baseTime.getTime() + 2000);
      const costBasis = await calculator.getCostBasis(
        testUserId,
        'ETH',
        new Decimal(15),
        sellTime,
        'FIFO'
      );

      expect(costBasis.toNumber()).toBeCloseTo(1166.67, 2);
    });

    it('should return zero cost basis when no purchases exist', async () => {
      const sellTime = new Date('2024-01-01T00:00:00Z');
      const costBasis = await calculator.getCostBasis(
        testUserId,
        'ETH',
        new Decimal(10),
        sellTime,
        'FIFO'
      );

      expect(costBasis.toNumber()).toBe(0);
    });
  });

  describe('updateHoldings', () => {
    it('should calculate holdings correctly with buys only', async () => {
      const baseTime = new Date('2024-01-01T00:00:00Z');
      
      await prisma.pnLTransaction.createMany({
        data: [
          {
            userId: testUserId,
            walletAddress: 'wallet1',
            chain: 'ethereum',
            tokenSymbol: 'ETH',
            txType: 'buy',
            quantity: 10,
            priceUsd: 1000,
            timestamp: new Date(baseTime.getTime()),
            txHash: 'hash1',
            source: 'wallet'
          },
          {
            userId: testUserId,
            walletAddress: 'wallet1',
            chain: 'ethereum',
            tokenSymbol: 'ETH',
            txType: 'buy',
            quantity: 5,
            priceUsd: 1500,
            timestamp: new Date(baseTime.getTime() + 1000),
            txHash: 'hash2',
            source: 'wallet'
          }
        ]
      });

      await calculator.updateHoldings(testUserId, 'ETH', 'FIFO');

      const holding = await calculator.getHolding(testUserId, 'ETH', 'FIFO');
      
      expect(holding).not.toBeNull();
      expect(holding!.quantity.toNumber()).toBe(15);
      expect(holding!.costBasisUsd.toNumber()).toBe(17500);
    });

    it('should calculate holdings correctly with buys and sells', async () => {
      const baseTime = new Date('2024-01-01T00:00:00Z');
      
      await prisma.pnLTransaction.createMany({
        data: [
          {
            userId: testUserId,
            walletAddress: 'wallet1',
            chain: 'ethereum',
            tokenSymbol: 'ETH',
            txType: 'buy',
            quantity: 10,
            priceUsd: 1000,
            timestamp: new Date(baseTime.getTime()),
            txHash: 'hash1',
            source: 'wallet'
          },
          {
            userId: testUserId,
            walletAddress: 'wallet1',
            chain: 'ethereum',
            tokenSymbol: 'ETH',
            txType: 'buy',
            quantity: 10,
            priceUsd: 1500,
            timestamp: new Date(baseTime.getTime() + 1000),
            txHash: 'hash2',
            source: 'wallet'
          },
          {
            userId: testUserId,
            walletAddress: 'wallet1',
            chain: 'ethereum',
            tokenSymbol: 'ETH',
            txType: 'sell',
            quantity: 15,
            priceUsd: 2000,
            timestamp: new Date(baseTime.getTime() + 2000),
            txHash: 'hash3',
            source: 'wallet'
          }
        ]
      });

      await calculator.updateHoldings(testUserId, 'ETH', 'FIFO');

      const holding = await calculator.getHolding(testUserId, 'ETH', 'FIFO');
      
      expect(holding).not.toBeNull();
      expect(holding!.quantity.toNumber()).toBe(5);
      expect(holding!.costBasisUsd.toNumber()).toBe(7500);
    });
  });
});
