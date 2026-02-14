/**
 * Unit Tests for PriceFetchingService
 * 
 * Tests historical price fetching, current price fetching, caching, and fallback logic.
 */

import { PriceFetchingService } from '../services/priceFetching.service';
import { Decimal } from '../utils/decimal';
import * as priceServiceV2 from '../services/priceServiceV2';
import redis from '../utils/redis';

// Mock the dependencies
jest.mock('../services/priceServiceV2');
jest.mock('../utils/redis');

describe('PriceFetchingService', () => {
  let service: PriceFetchingService;

  beforeEach(() => {
    service = new PriceFetchingService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    service.clearCache();
  });

  describe('getCurrentPrice', () => {
    it('should fetch current price from price service', async () => {
      // Arrange
      const mockPrice = {
        symbol: 'ETH',
        priceUsd: 2000.50,
        lastUpdated: new Date(),
        source: 'CoinGecko',
      };
      (priceServiceV2.getTokenPriceWithFallback as jest.Mock).mockResolvedValue(mockPrice);

      // Act
      const result = await service.getCurrentPrice('ETH');

      // Assert
      expect(result).toBeInstanceOf(Decimal);
      expect(result?.toString()).toBe('2000.5');
      expect(priceServiceV2.getTokenPriceWithFallback).toHaveBeenCalledWith('ETH');
    });

    it('should normalize token symbol to uppercase', async () => {
      // Arrange
      const mockPrice = {
        symbol: 'USDC',
        priceUsd: 1.0,
        lastUpdated: new Date(),
        source: 'CoinGecko',
      };
      (priceServiceV2.getTokenPriceWithFallback as jest.Mock).mockResolvedValue(mockPrice);

      // Act
      await service.getCurrentPrice('usdc');

      // Assert
      expect(priceServiceV2.getTokenPriceWithFallback).toHaveBeenCalledWith('USDC');
    });

    it('should return null when price service returns null', async () => {
      // Arrange
      (priceServiceV2.getTokenPriceWithFallback as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await service.getCurrentPrice('UNKNOWN');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when price service throws error', async () => {
      // Arrange
      (priceServiceV2.getTokenPriceWithFallback as jest.Mock).mockRejectedValue(
        new Error('API error')
      );

      // Act
      const result = await service.getCurrentPrice('ETH');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getHistoricalPrice', () => {
    it('should return cached price from in-memory cache', async () => {
      // Arrange
      const timestamp = new Date('2024-01-01T12:00:00Z');
      const cachedPrice = new Decimal(1500);
      
      // Pre-populate cache
      const cacheKey = `historical:ETH:${timestamp.toISOString()}`;
      service['cache'].set(cacheKey, { price: cachedPrice, timestamp });

      // Act
      const result = await service.getHistoricalPrice('ETH', timestamp);

      // Assert
      expect(result).toBeInstanceOf(Decimal);
      expect(result?.toString()).toBe('1500');
      expect(redis.get).not.toHaveBeenCalled();
    });

    it('should return cached price from Redis', async () => {
      // Arrange
      const timestamp = new Date('2024-01-01T12:00:00Z');
      (redis.get as jest.Mock).mockResolvedValue('1800.50');

      // Act
      const result = await service.getHistoricalPrice('ETH', timestamp);

      // Assert
      expect(result).toBeInstanceOf(Decimal);
      expect(result?.toString()).toBe('1800.5');
      expect(redis.get).toHaveBeenCalledWith(
        `historical:ETH:${timestamp.toISOString()}`
      );
    });

    it('should fetch and cache price for recent timestamp', async () => {
      // Arrange
      const recentTimestamp = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
      const mockPrice = {
        symbol: 'ETH',
        priceUsd: 2100,
        lastUpdated: new Date(),
        source: 'CoinGecko',
      };
      
      (redis.get as jest.Mock).mockResolvedValue(null);
      (priceServiceV2.getTokenPriceWithFallback as jest.Mock).mockResolvedValue(mockPrice);
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      // Act
      const result = await service.getHistoricalPrice('ETH', recentTimestamp);

      // Assert
      expect(result).toBeInstanceOf(Decimal);
      expect(result?.toString()).toBe('2100');
      expect(redis.setex).toHaveBeenCalled();
    });

    it('should normalize token symbol to uppercase', async () => {
      // Arrange
      const timestamp = new Date('2024-01-01T12:00:00Z');
      (redis.get as jest.Mock).mockResolvedValue('1.0');

      // Act
      await service.getHistoricalPrice('usdc', timestamp);

      // Assert
      expect(redis.get).toHaveBeenCalledWith(
        `historical:USDC:${timestamp.toISOString()}`
      );
    });

    it('should return null when no price is available', async () => {
      // Arrange
      const oldTimestamp = new Date('2020-01-01T12:00:00Z');
      (redis.get as jest.Mock).mockResolvedValue(null);
      (priceServiceV2.getTokenPriceWithFallback as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await service.getHistoricalPrice('UNKNOWN', oldTimestamp);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getMultipleHistoricalPrices', () => {
    it('should fetch prices for multiple tokens', async () => {
      // Arrange
      const timestamp = new Date('2024-01-01T12:00:00Z');
      const tokens = ['ETH', 'USDC', 'DAI'];
      
      (redis.get as jest.Mock).mockImplementation(async (key: string) => {
        if (key.includes('ETH')) return '2000';
        if (key.includes('USDC')) return '1.0';
        if (key.includes('DAI')) return '0.99';
        return null;
      });

      // Act
      const result = await service.getMultipleHistoricalPrices(tokens, timestamp);

      // Assert
      expect(result.size).toBe(3);
      expect(result.get('ETH')?.toString()).toBe('2000');
      expect(result.get('USDC')?.toString()).toBe('1');
      expect(result.get('DAI')?.toString()).toBe('0.99');
    });

    it('should handle partial failures gracefully', async () => {
      // Arrange
      const timestamp = new Date('2024-01-01T12:00:00Z');
      const tokens = ['ETH', 'UNKNOWN'];
      
      (redis.get as jest.Mock).mockImplementation(async (key: string) => {
        if (key.includes('ETH')) return '2000';
        return null;
      });
      (priceServiceV2.getTokenPriceWithFallback as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await service.getMultipleHistoricalPrices(tokens, timestamp);

      // Assert
      expect(result.size).toBe(1);
      expect(result.get('ETH')?.toString()).toBe('2000');
      expect(result.has('UNKNOWN')).toBe(false);
    });

    it('should normalize all token symbols to uppercase', async () => {
      // Arrange
      const timestamp = new Date('2024-01-01T12:00:00Z');
      const tokens = ['eth', 'usdc'];
      
      (redis.get as jest.Mock).mockImplementation(async (key: string) => {
        if (key.includes('ETH')) return '2000';
        if (key.includes('USDC')) return '1.0';
        return null;
      });

      // Act
      const result = await service.getMultipleHistoricalPrices(tokens, timestamp);

      // Assert
      expect(result.has('ETH')).toBe(true);
      expect(result.has('USDC')).toBe(true);
      expect(result.has('eth')).toBe(false);
      expect(result.has('usdc')).toBe(false);
    });
  });

  describe('caching behavior', () => {
    it('should cache historical prices in both memory and Redis', async () => {
      // Arrange
      const timestamp = new Date(Date.now() - 30 * 60 * 1000);
      const mockPrice = {
        symbol: 'ETH',
        priceUsd: 2000,
        lastUpdated: new Date(),
        source: 'CoinGecko',
      };
      
      (redis.get as jest.Mock).mockResolvedValue(null);
      (priceServiceV2.getTokenPriceWithFallback as jest.Mock).mockResolvedValue(mockPrice);
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      // Act
      await service.getHistoricalPrice('ETH', timestamp);

      // Assert
      expect(redis.setex).toHaveBeenCalled();
      const stats = service.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should use in-memory cache on subsequent calls', async () => {
      // Arrange
      const timestamp = new Date(Date.now() - 30 * 60 * 1000);
      const mockPrice = {
        symbol: 'ETH',
        priceUsd: 2000,
        lastUpdated: new Date(),
        source: 'CoinGecko',
      };
      
      (redis.get as jest.Mock).mockResolvedValue(null);
      (priceServiceV2.getTokenPriceWithFallback as jest.Mock).mockResolvedValue(mockPrice);
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      // Act
      await service.getHistoricalPrice('ETH', timestamp);
      jest.clearAllMocks();
      await service.getHistoricalPrice('ETH', timestamp);

      // Assert
      expect(redis.get).not.toHaveBeenCalled();
      expect(priceServiceV2.getTokenPriceWithFallback).not.toHaveBeenCalled();
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      // Arrange
      const timestamp = new Date();
      const cacheKey = `historical:ETH:${timestamp.toISOString()}`;
      service['cache'].set(cacheKey, { price: new Decimal(2000), timestamp });

      // Act
      service.clearCache();

      // Assert
      const stats = service.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should return cache statistics', () => {
      // Arrange
      const timestamp1 = new Date('2024-01-01T12:00:00Z');
      const timestamp2 = new Date('2024-01-02T12:00:00Z');
      service['cache'].set(`historical:ETH:${timestamp1.toISOString()}`, {
        price: new Decimal(2000),
        timestamp: timestamp1,
      });
      service['cache'].set(`historical:USDC:${timestamp2.toISOString()}`, {
        price: new Decimal(1),
        timestamp: timestamp2,
      });

      // Act
      const stats = service.getCacheStats();

      // Assert
      expect(stats.size).toBe(2);
      expect(stats.keys).toHaveLength(2);
      expect(stats.keys[0]).toContain('historical:');
    });
  });

  describe('edge cases', () => {
    it('should handle very old timestamps', async () => {
      // Arrange
      const veryOldTimestamp = new Date('2015-01-01T00:00:00Z');
      (redis.get as jest.Mock).mockResolvedValue(null);
      (priceServiceV2.getTokenPriceWithFallback as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await service.getHistoricalPrice('ETH', veryOldTimestamp);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle future timestamps', async () => {
      // Arrange
      const futureTimestamp = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const mockPrice = {
        symbol: 'ETH',
        priceUsd: 2000,
        lastUpdated: new Date(),
        source: 'CoinGecko',
      };
      
      (redis.get as jest.Mock).mockResolvedValue(null);
      (priceServiceV2.getTokenPriceWithFallback as jest.Mock).mockResolvedValue(mockPrice);
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      // Act
      const result = await service.getHistoricalPrice('ETH', futureTimestamp);

      // Assert
      expect(result).toBeInstanceOf(Decimal);
    });

    it('should handle empty token symbol', async () => {
      // Arrange
      (priceServiceV2.getTokenPriceWithFallback as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await service.getCurrentPrice('');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle zero price values', async () => {
      // Arrange
      const mockPrice = {
        symbol: 'ETH',
        priceUsd: 0,
        lastUpdated: new Date(),
        source: 'CoinGecko',
      };
      (priceServiceV2.getTokenPriceWithFallback as jest.Mock).mockResolvedValue(mockPrice);

      // Act
      const result = await service.getCurrentPrice('ETH');

      // Assert
      // Zero price is treated as unavailable
      expect(result).toBeNull();
    });
  });
});
