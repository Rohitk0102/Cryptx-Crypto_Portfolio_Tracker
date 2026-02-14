/**
 * Unit Tests for Cost Basis Methods
 * 
 * Tests the FIFO, LIFO, and Weighted Average cost basis calculation methods
 * with specific examples and edge cases.
 */

import { describe, it, expect } from '@jest/globals';
import { Decimal } from '../utils/decimal';
import {
  FIFOMethod,
  LIFOMethod,
  WeightedAverageMethod,
  getCostBasisMethod,
  Purchase,
  SUPPORTED_METHODS
} from '../services/costBasisMethods';

describe('Cost Basis Methods', () => {
  describe('FIFOMethod', () => {
    const fifo = new FIFOMethod();

    it('should calculate cost basis using earliest purchases first', () => {
      const purchases: Purchase[] = [
        { quantity: new Decimal(10), priceUsd: new Decimal(1000), timestamp: new Date('2024-01-01') },
        { quantity: new Decimal(10), priceUsd: new Decimal(1500), timestamp: new Date('2024-01-15') },
      ];

      const result = fifo.calculate(purchases, new Decimal(15));

      // Should use: 10 @ $1000 + 5 @ $1500 = $17,500
      // Average: $17,500 / 15 = $1,166.67
      expect(result.costBasis.toFixed(2)).toBe('1166.67');
      expect(result.remainingPurchases.length).toBe(1);
      expect(result.remainingPurchases[0].quantity.toString()).toBe('5');
      expect(result.remainingPurchases[0].priceUsd.toString()).toBe('1500');
    });

    it('should handle selling exact quantity of first purchase', () => {
      const purchases: Purchase[] = [
        { quantity: new Decimal(10), priceUsd: new Decimal(1000), timestamp: new Date('2024-01-01') },
        { quantity: new Decimal(10), priceUsd: new Decimal(1500), timestamp: new Date('2024-01-15') },
      ];

      const result = fifo.calculate(purchases, new Decimal(10));

      expect(result.costBasis.toString()).toBe('1000');
      expect(result.remainingPurchases.length).toBe(1);
      expect(result.remainingPurchases[0].quantity.toString()).toBe('10');
      expect(result.remainingPurchases[0].priceUsd.toString()).toBe('1500');
    });

    it('should handle selling all purchases', () => {
      const purchases: Purchase[] = [
        { quantity: new Decimal(10), priceUsd: new Decimal(1000), timestamp: new Date('2024-01-01') },
        { quantity: new Decimal(5), priceUsd: new Decimal(1500), timestamp: new Date('2024-01-15') },
      ];

      const result = fifo.calculate(purchases, new Decimal(15));

      // Total cost: 10 * 1000 + 5 * 1500 = 17,500
      // Average: 17,500 / 15 = 1,166.67
      expect(result.costBasis.toFixed(2)).toBe('1166.67');
      expect(result.remainingPurchases.length).toBe(0);
    });

    it('should handle partial sell of first purchase', () => {
      const purchases: Purchase[] = [
        { quantity: new Decimal(10), priceUsd: new Decimal(1000), timestamp: new Date('2024-01-01') },
        { quantity: new Decimal(10), priceUsd: new Decimal(1500), timestamp: new Date('2024-01-15') },
      ];

      const result = fifo.calculate(purchases, new Decimal(5));

      expect(result.costBasis.toString()).toBe('1000');
      expect(result.remainingPurchases.length).toBe(2);
      expect(result.remainingPurchases[0].quantity.toString()).toBe('5');
      expect(result.remainingPurchases[1].quantity.toString()).toBe('10');
    });

    it('should handle zero sell quantity', () => {
      const purchases: Purchase[] = [
        { quantity: new Decimal(10), priceUsd: new Decimal(1000), timestamp: new Date('2024-01-01') },
      ];

      const result = fifo.calculate(purchases, new Decimal(0));

      expect(result.costBasis.toString()).toBe('0');
      expect(result.remainingPurchases.length).toBe(1);
      expect(result.remainingPurchases[0].quantity.toString()).toBe('10');
    });

    it('should handle empty purchases array', () => {
      const purchases: Purchase[] = [];

      const result = fifo.calculate(purchases, new Decimal(5));

      expect(result.costBasis.toString()).toBe('0');
      expect(result.remainingPurchases.length).toBe(0);
    });

    it('should handle three purchases with varying prices', () => {
      const purchases: Purchase[] = [
        { quantity: new Decimal(5), priceUsd: new Decimal(1000), timestamp: new Date('2024-01-01') },
        { quantity: new Decimal(5), priceUsd: new Decimal(1200), timestamp: new Date('2024-01-10') },
        { quantity: new Decimal(5), priceUsd: new Decimal(1500), timestamp: new Date('2024-01-20') },
      ];

      const result = fifo.calculate(purchases, new Decimal(12));

      // Should use: 5 @ $1000 + 5 @ $1200 + 2 @ $1500 = $14,000
      // Average: $14,000 / 12 = $1,166.67
      expect(result.costBasis.toFixed(2)).toBe('1166.67');
      expect(result.remainingPurchases.length).toBe(1);
      expect(result.remainingPurchases[0].quantity.toString()).toBe('3');
      expect(result.remainingPurchases[0].priceUsd.toString()).toBe('1500');
    });
  });

  describe('LIFOMethod', () => {
    const lifo = new LIFOMethod();

    it('should calculate cost basis using most recent purchases first', () => {
      const purchases: Purchase[] = [
        { quantity: new Decimal(10), priceUsd: new Decimal(1000), timestamp: new Date('2024-01-01') },
        { quantity: new Decimal(10), priceUsd: new Decimal(1500), timestamp: new Date('2024-01-15') },
      ];

      const result = lifo.calculate(purchases, new Decimal(15));

      // Should use: 10 @ $1500 + 5 @ $1000 = $20,000
      // Average: $20,000 / 15 = $1,333.33
      expect(result.costBasis.toFixed(2)).toBe('1333.33');
      expect(result.remainingPurchases.length).toBe(1);
      expect(result.remainingPurchases[0].quantity.toString()).toBe('5');
      expect(result.remainingPurchases[0].priceUsd.toString()).toBe('1000');
    });

    it('should handle selling exact quantity of last purchase', () => {
      const purchases: Purchase[] = [
        { quantity: new Decimal(10), priceUsd: new Decimal(1000), timestamp: new Date('2024-01-01') },
        { quantity: new Decimal(10), priceUsd: new Decimal(1500), timestamp: new Date('2024-01-15') },
      ];

      const result = lifo.calculate(purchases, new Decimal(10));

      expect(result.costBasis.toString()).toBe('1500');
      expect(result.remainingPurchases.length).toBe(1);
      expect(result.remainingPurchases[0].quantity.toString()).toBe('10');
      expect(result.remainingPurchases[0].priceUsd.toString()).toBe('1000');
    });

    it('should handle selling all purchases', () => {
      const purchases: Purchase[] = [
        { quantity: new Decimal(10), priceUsd: new Decimal(1000), timestamp: new Date('2024-01-01') },
        { quantity: new Decimal(5), priceUsd: new Decimal(1500), timestamp: new Date('2024-01-15') },
      ];

      const result = lifo.calculate(purchases, new Decimal(15));

      // Total cost: 5 * 1500 + 10 * 1000 = 17,500
      // Average: 17,500 / 15 = 1,166.67
      expect(result.costBasis.toFixed(2)).toBe('1166.67');
      expect(result.remainingPurchases.length).toBe(0);
    });

    it('should handle partial sell of last purchase', () => {
      const purchases: Purchase[] = [
        { quantity: new Decimal(10), priceUsd: new Decimal(1000), timestamp: new Date('2024-01-01') },
        { quantity: new Decimal(10), priceUsd: new Decimal(1500), timestamp: new Date('2024-01-15') },
      ];

      const result = lifo.calculate(purchases, new Decimal(5));

      expect(result.costBasis.toString()).toBe('1500');
      expect(result.remainingPurchases.length).toBe(2);
      expect(result.remainingPurchases[0].quantity.toString()).toBe('10');
      expect(result.remainingPurchases[1].quantity.toString()).toBe('5');
    });

    it('should handle zero sell quantity', () => {
      const purchases: Purchase[] = [
        { quantity: new Decimal(10), priceUsd: new Decimal(1000), timestamp: new Date('2024-01-01') },
      ];

      const result = lifo.calculate(purchases, new Decimal(0));

      expect(result.costBasis.toString()).toBe('0');
      expect(result.remainingPurchases.length).toBe(1);
      expect(result.remainingPurchases[0].quantity.toString()).toBe('10');
    });

    it('should handle empty purchases array', () => {
      const purchases: Purchase[] = [];

      const result = lifo.calculate(purchases, new Decimal(5));

      expect(result.costBasis.toString()).toBe('0');
      expect(result.remainingPurchases.length).toBe(0);
    });

    it('should handle three purchases with varying prices', () => {
      const purchases: Purchase[] = [
        { quantity: new Decimal(5), priceUsd: new Decimal(1000), timestamp: new Date('2024-01-01') },
        { quantity: new Decimal(5), priceUsd: new Decimal(1200), timestamp: new Date('2024-01-10') },
        { quantity: new Decimal(5), priceUsd: new Decimal(1500), timestamp: new Date('2024-01-20') },
      ];

      const result = lifo.calculate(purchases, new Decimal(12));

      // Should use: 5 @ $1500 + 5 @ $1200 + 2 @ $1000 = $15,500
      // Average: $15,500 / 12 = $1,291.67
      expect(result.costBasis.toFixed(2)).toBe('1291.67');
      expect(result.remainingPurchases.length).toBe(1);
      expect(result.remainingPurchases[0].quantity.toString()).toBe('3');
      expect(result.remainingPurchases[0].priceUsd.toString()).toBe('1000');
    });
  });

  describe('WeightedAverageMethod', () => {
    const weightedAvg = new WeightedAverageMethod();

    it('should calculate cost basis using weighted average', () => {
      const purchases: Purchase[] = [
        { quantity: new Decimal(10), priceUsd: new Decimal(1000), timestamp: new Date('2024-01-01') },
        { quantity: new Decimal(10), priceUsd: new Decimal(1500), timestamp: new Date('2024-01-15') },
      ];

      const result = weightedAvg.calculate(purchases, new Decimal(15));

      // Total: 20 ETH for $25,000 = $1,250 average
      // Sell 15 @ $1,250 = $18,750 cost basis
      expect(result.costBasis.toString()).toBe('1250');
      expect(result.remainingPurchases.length).toBe(2);
      
      // Remaining quantity should be 5 total (20 - 15)
      const totalRemaining = result.remainingPurchases.reduce(
        (sum, p) => sum.plus(p.quantity),
        new Decimal(0)
      );
      expect(totalRemaining.toString()).toBe('5');
      
      // All remaining purchases should have the weighted average price
      result.remainingPurchases.forEach(p => {
        expect(p.priceUsd.toString()).toBe('1250');
      });
    });

    it('should handle selling all purchases', () => {
      const purchases: Purchase[] = [
        { quantity: new Decimal(10), priceUsd: new Decimal(1000), timestamp: new Date('2024-01-01') },
        { quantity: new Decimal(10), priceUsd: new Decimal(1500), timestamp: new Date('2024-01-15') },
      ];

      const result = weightedAvg.calculate(purchases, new Decimal(20));

      expect(result.costBasis.toString()).toBe('1250');
      expect(result.remainingPurchases.length).toBe(0);
    });

    it('should handle partial sell', () => {
      const purchases: Purchase[] = [
        { quantity: new Decimal(10), priceUsd: new Decimal(1000), timestamp: new Date('2024-01-01') },
        { quantity: new Decimal(10), priceUsd: new Decimal(1500), timestamp: new Date('2024-01-15') },
      ];

      const result = weightedAvg.calculate(purchases, new Decimal(5));

      // Weighted average: (10*1000 + 10*1500) / 20 = 1250
      expect(result.costBasis.toString()).toBe('1250');
      
      // Remaining: 15 total
      const totalRemaining = result.remainingPurchases.reduce(
        (sum, p) => sum.plus(p.quantity),
        new Decimal(0)
      );
      expect(totalRemaining.toString()).toBe('15');
    });

    it('should handle zero sell quantity', () => {
      const purchases: Purchase[] = [
        { quantity: new Decimal(10), priceUsd: new Decimal(1000), timestamp: new Date('2024-01-01') },
      ];

      const result = weightedAvg.calculate(purchases, new Decimal(0));

      expect(result.costBasis.toString()).toBe('1000');
      expect(result.remainingPurchases.length).toBe(1);
      expect(result.remainingPurchases[0].quantity.toString()).toBe('10');
    });

    it('should handle empty purchases array', () => {
      const purchases: Purchase[] = [];

      const result = weightedAvg.calculate(purchases, new Decimal(5));

      expect(result.costBasis.toString()).toBe('0');
      expect(result.remainingPurchases.length).toBe(0);
    });

    it('should handle three purchases with varying prices', () => {
      const purchases: Purchase[] = [
        { quantity: new Decimal(5), priceUsd: new Decimal(1000), timestamp: new Date('2024-01-01') },
        { quantity: new Decimal(5), priceUsd: new Decimal(1200), timestamp: new Date('2024-01-10') },
        { quantity: new Decimal(5), priceUsd: new Decimal(1500), timestamp: new Date('2024-01-20') },
      ];

      const result = weightedAvg.calculate(purchases, new Decimal(12));

      // Total: 15 for $18,500 = $1,233.33 average
      expect(result.costBasis.toFixed(2)).toBe('1233.33');
      
      // Remaining: 3 total
      const totalRemaining = result.remainingPurchases.reduce(
        (sum, p) => sum.plus(p.quantity),
        new Decimal(0)
      );
      expect(totalRemaining.toString()).toBe('3');
    });

    it('should proportionally reduce all purchases', () => {
      const purchases: Purchase[] = [
        { quantity: new Decimal(10), priceUsd: new Decimal(1000), timestamp: new Date('2024-01-01') },
        { quantity: new Decimal(10), priceUsd: new Decimal(1500), timestamp: new Date('2024-01-15') },
      ];

      const result = weightedAvg.calculate(purchases, new Decimal(10));

      // Selling 10 out of 20 (50%)
      // Each purchase should be reduced by 50%
      expect(result.remainingPurchases.length).toBe(2);
      expect(result.remainingPurchases[0].quantity.toString()).toBe('5');
      expect(result.remainingPurchases[1].quantity.toString()).toBe('5');
    });
  });

  describe('getCostBasisMethod', () => {
    it('should return FIFOMethod for "FIFO"', () => {
      const method = getCostBasisMethod('FIFO');
      expect(method).toBeInstanceOf(FIFOMethod);
    });

    it('should return LIFOMethod for "LIFO"', () => {
      const method = getCostBasisMethod('LIFO');
      expect(method).toBeInstanceOf(LIFOMethod);
    });

    it('should return WeightedAverageMethod for "WEIGHTED_AVERAGE"', () => {
      const method = getCostBasisMethod('WEIGHTED_AVERAGE');
      expect(method).toBeInstanceOf(WeightedAverageMethod);
    });

    it('should throw error for unknown method', () => {
      expect(() => getCostBasisMethod('UNKNOWN')).toThrow('Unknown cost basis method: UNKNOWN');
    });
  });

  describe('SUPPORTED_METHODS', () => {
    it('should contain all three methods', () => {
      expect(SUPPORTED_METHODS).toEqual(['FIFO', 'LIFO', 'WEIGHTED_AVERAGE']);
    });
  });

  describe('Method Comparison', () => {
    it('should produce different results for FIFO vs LIFO with varying prices', () => {
      const purchases: Purchase[] = [
        { quantity: new Decimal(10), priceUsd: new Decimal(1000), timestamp: new Date('2024-01-01') },
        { quantity: new Decimal(10), priceUsd: new Decimal(2000), timestamp: new Date('2024-01-15') },
      ];

      const fifo = new FIFOMethod();
      const lifo = new LIFOMethod();

      const fifoResult = fifo.calculate(purchases, new Decimal(10));
      const lifoResult = lifo.calculate(purchases, new Decimal(10));

      // FIFO should use $1000, LIFO should use $2000
      expect(fifoResult.costBasis.toString()).toBe('1000');
      expect(lifoResult.costBasis.toString()).toBe('2000');
      expect(fifoResult.costBasis.eq(lifoResult.costBasis)).toBe(false);
    });

    it('should produce same results for all methods with uniform prices', () => {
      const purchases: Purchase[] = [
        { quantity: new Decimal(10), priceUsd: new Decimal(1000), timestamp: new Date('2024-01-01') },
        { quantity: new Decimal(10), priceUsd: new Decimal(1000), timestamp: new Date('2024-01-15') },
      ];

      const fifo = new FIFOMethod();
      const lifo = new LIFOMethod();
      const weightedAvg = new WeightedAverageMethod();

      const fifoResult = fifo.calculate(purchases, new Decimal(10));
      const lifoResult = lifo.calculate(purchases, new Decimal(10));
      const weightedAvgResult = weightedAvg.calculate(purchases, new Decimal(10));

      // All should produce $1000 cost basis
      expect(fifoResult.costBasis.toString()).toBe('1000');
      expect(lifoResult.costBasis.toString()).toBe('1000');
      expect(weightedAvgResult.costBasis.toString()).toBe('1000');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small quantities with high precision', () => {
      const fifo = new FIFOMethod();
      const purchases: Purchase[] = [
        { 
          quantity: new Decimal('0.000000000000000001'), // 1 wei
          priceUsd: new Decimal('1000'), 
          timestamp: new Date('2024-01-01') 
        },
      ];

      const result = fifo.calculate(purchases, new Decimal('0.0000000000000000005'));

      expect(result.costBasis.toString()).toBe('1000');
      expect(result.remainingPurchases[0].quantity.toString()).toBe('0.0000000000000000005');
    });

    it('should handle very large quantities', () => {
      const fifo = new FIFOMethod();
      const purchases: Purchase[] = [
        { 
          quantity: new Decimal('1000000000'), // 1 billion
          priceUsd: new Decimal('1000'), 
          timestamp: new Date('2024-01-01') 
        },
      ];

      const result = fifo.calculate(purchases, new Decimal('500000000'));

      expect(result.costBasis.toString()).toBe('1000');
      expect(result.remainingPurchases[0].quantity.toString()).toBe('500000000');
    });

    it('should handle selling more than available (edge case)', () => {
      const fifo = new FIFOMethod();
      const purchases: Purchase[] = [
        { quantity: new Decimal(10), priceUsd: new Decimal(1000), timestamp: new Date('2024-01-01') },
      ];

      const result = fifo.calculate(purchases, new Decimal(15));

      // Should use all 10 available
      // Cost basis: 10 * 1000 / 15 = 666.67
      expect(result.costBasis.toFixed(2)).toBe('666.67');
      expect(result.remainingPurchases.length).toBe(0);
    });
  });
});
