/**
 * Unit Tests for Technical Analysis Engine
 * 
 * Tests the calculation of technical indicators including RSI, MACD,
 * Bollinger Bands, and Moving Averages.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  TechnicalAnalysisEngine,
  InsufficientDataError,
  CandlestickData,
  TechnicalIndicators
} from '../services/technicalAnalysis';

describe('TechnicalAnalysisEngine', () => {
  let engine: TechnicalAnalysisEngine;

  beforeEach(() => {
    engine = new TechnicalAnalysisEngine();
  });

  describe('calculateRSI', () => {
    it('should calculate RSI correctly for known price series', () => {
      // Known test case with expected RSI value
      // Using Wilder's smoothing method with simple average for first period
      const prices = [
        44, 44.34, 44.09, 43.61, 44.33, 44.83, 45.10, 45.42,
        45.84, 46.08, 45.89, 46.03, 45.61, 46.28, 46.28
      ];
      
      const rsi = engine.calculateRSI(prices, 14);
      
      // RSI should be calculated
      // With 15 prices and period 14, we get 1 RSI value
      // Gains: 0.34, 0.72, 0.50, 0.27, 0.32, 0.42, 0.24, 0.14, 0.67 = 3.62
      // Losses: 0.25, 0.48, 0.19, 0.42 = 1.34
      // Avg Gain = 3.62/14 = 0.2586, Avg Loss = 1.34/14 = 0.0957
      // RS = 2.701, RSI = 100 - (100 / 3.701) = 72.98
      expect(rsi).toBeDefined();
      expect(rsi.length).toBe(1);
      expect(rsi[0]).toBeCloseTo(72.98, 1);
    });

    it('should throw InsufficientDataError for insufficient data', () => {
      const prices = [44, 44.34, 44.09]; // Only 3 prices, need at least 15
      
      expect(() => engine.calculateRSI(prices, 14)).toThrow(InsufficientDataError);
    });

    it('should return RSI values between 0 and 100', () => {
      const prices = Array.from({ length: 30 }, (_, i) => 100 + Math.random() * 10);
      
      const rsi = engine.calculateRSI(prices, 14);
      
      rsi.forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      });
    });

    it('should handle all identical prices (neutral RSI)', () => {
      const prices = new Array(20).fill(100);
      
      const rsi = engine.calculateRSI(prices, 14);
      
      // When prices don't change, RSI should be 50 (neutral)
      expect(rsi[rsi.length - 1]).toBeCloseTo(50, 1);
    });
  });

  describe('calculateMACD', () => {
    it('should calculate MACD with correct structure', () => {
      const prices = Array.from({ length: 50 }, (_, i) => 100 + i * 0.5);
      
      const macd = engine.calculateMACD(prices, 12, 26, 9);
      
      expect(macd).toHaveProperty('macdLine');
      expect(macd).toHaveProperty('signalLine');
      expect(macd).toHaveProperty('histogram');
      expect(Array.isArray(macd.macdLine)).toBe(true);
      expect(Array.isArray(macd.signalLine)).toBe(true);
      expect(Array.isArray(macd.histogram)).toBe(true);
    });

    it('should throw InsufficientDataError for insufficient data', () => {
      const prices = Array.from({ length: 20 }, (_, i) => 100 + i); // Need at least 26
      
      expect(() => engine.calculateMACD(prices, 12, 26, 9)).toThrow(InsufficientDataError);
    });

    it('should calculate histogram as MACD line minus signal line', () => {
      const prices = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i / 5) * 10);
      
      const macd = engine.calculateMACD(prices, 12, 26, 9);
      
      // Histogram should equal MACD line - signal line
      for (let i = 0; i < macd.histogram.length; i++) {
        const expectedHistogram = macd.macdLine[i] - macd.signalLine[i];
        expect(macd.histogram[i]).toBeCloseTo(expectedHistogram, 5);
      }
    });
  });

  describe('calculateBollingerBands', () => {
    it('should calculate Bollinger Bands with correct structure', () => {
      const prices = Array.from({ length: 30 }, (_, i) => 100 + Math.random() * 10);
      
      const bands = engine.calculateBollingerBands(prices, 20, 2);
      
      expect(bands).toHaveProperty('upper');
      expect(bands).toHaveProperty('middle');
      expect(bands).toHaveProperty('lower');
      expect(Array.isArray(bands.upper)).toBe(true);
      expect(Array.isArray(bands.middle)).toBe(true);
      expect(Array.isArray(bands.lower)).toBe(true);
    });

    it('should throw InsufficientDataError for insufficient data', () => {
      const prices = Array.from({ length: 15 }, (_, i) => 100 + i); // Need at least 20
      
      expect(() => engine.calculateBollingerBands(prices, 20, 2)).toThrow(InsufficientDataError);
    });

    it('should have upper band above middle and lower band below middle', () => {
      const prices = Array.from({ length: 30 }, (_, i) => 100 + Math.random() * 10);
      
      const bands = engine.calculateBollingerBands(prices, 20, 2);
      
      for (let i = 0; i < bands.upper.length; i++) {
        expect(bands.upper[i]).toBeGreaterThanOrEqual(bands.middle[i]);
        expect(bands.lower[i]).toBeLessThanOrEqual(bands.middle[i]);
      }
    });

    it('should have middle band equal to SMA', () => {
      const prices = Array.from({ length: 30 }, (_, i) => 100 + i * 0.5);
      
      const bands = engine.calculateBollingerBands(prices, 20, 2);
      const sma = engine.calculateSMA(prices, 20);
      
      // Middle band should equal SMA
      for (let i = 0; i < bands.middle.length; i++) {
        expect(bands.middle[i]).toBeCloseTo(sma[i], 5);
      }
    });
  });

  describe('calculateSMA', () => {
    it('should calculate SMA correctly', () => {
      const prices = [10, 20, 30, 40, 50];
      
      const sma = engine.calculateSMA(prices, 3);
      
      // SMA for last 3 values: (30 + 40 + 50) / 3 = 40
      expect(sma[sma.length - 1]).toBeCloseTo(40, 5);
    });

    it('should throw InsufficientDataError for insufficient data', () => {
      const prices = [10, 20];
      
      expect(() => engine.calculateSMA(prices, 5)).toThrow(InsufficientDataError);
    });

    it('should calculate correct number of SMA values', () => {
      const prices = Array.from({ length: 30 }, (_, i) => 100 + i);
      const period = 10;
      
      const sma = engine.calculateSMA(prices, period);
      
      // Should have (prices.length - period + 1) values
      expect(sma.length).toBe(prices.length - period + 1);
    });

    it('should equal arithmetic mean over period', () => {
      const prices = [100, 102, 104, 106, 108, 110, 112, 114, 116, 118];
      const period = 5;
      
      const sma = engine.calculateSMA(prices, period);
      
      // Last SMA should be mean of last 5 prices
      const lastPrices = prices.slice(-period);
      const expectedMean = lastPrices.reduce((a, b) => a + b, 0) / period;
      expect(sma[sma.length - 1]).toBeCloseTo(expectedMean, 5);
    });
  });

  describe('calculateEMA', () => {
    it('should calculate EMA correctly', () => {
      const prices = Array.from({ length: 20 }, (_, i) => 100 + i);
      
      const ema = engine.calculateEMA(prices, 10);
      
      expect(ema).toBeDefined();
      expect(ema.length).toBeGreaterThan(0);
    });

    it('should throw InsufficientDataError for insufficient data', () => {
      const prices = [10, 20];
      
      expect(() => engine.calculateEMA(prices, 5)).toThrow(InsufficientDataError);
    });

    it('should be more responsive than SMA to recent changes', () => {
      // Create prices with sudden increase at the end
      const prices = [...Array(20).fill(100), 110, 120, 130];
      
      const ema = engine.calculateEMA(prices, 10);
      const sma = engine.calculateSMA(prices, 10);
      
      // EMA should react more strongly to recent price increases
      expect(ema[ema.length - 1]).toBeGreaterThan(sma[sma.length - 1]);
    });
  });

  describe('calculateAllIndicators', () => {
    it('should calculate all indicators from candlestick data', () => {
      const candlesticks: CandlestickData[] = Array.from({ length: 100 }, (_, i) => ({
        timestamp: Date.now() - (100 - i) * 86400000,
        open: 100 + i * 0.5,
        high: 102 + i * 0.5,
        low: 98 + i * 0.5,
        close: 100 + i * 0.5,
        volume: 1000000
      }));
      
      const indicators = engine.calculateAllIndicators(candlesticks);
      
      expect(indicators).toHaveProperty('rsi');
      expect(indicators).toHaveProperty('macd');
      expect(indicators).toHaveProperty('bollingerBands');
      expect(indicators).toHaveProperty('movingAverages');
      
      expect(Array.isArray(indicators.rsi)).toBe(true);
      expect(indicators.macd).toHaveProperty('macdLine');
      expect(indicators.bollingerBands).toHaveProperty('upper');
      expect(indicators.movingAverages).toHaveProperty('sma7');
      expect(indicators.movingAverages).toHaveProperty('sma30');
      expect(indicators.movingAverages).toHaveProperty('sma90');
    });

    it('should throw InsufficientDataError for insufficient candlestick data', () => {
      const candlesticks: CandlestickData[] = Array.from({ length: 50 }, (_, i) => ({
        timestamp: Date.now() - (50 - i) * 86400000,
        open: 100,
        high: 102,
        low: 98,
        close: 100,
        volume: 1000000
      }));
      
      // Need at least 90 days for all indicators (especially SMA90)
      expect(() => engine.calculateAllIndicators(candlesticks)).toThrow(InsufficientDataError);
    });

    it('should use close prices from candlesticks', () => {
      const candlesticks: CandlestickData[] = Array.from({ length: 100 }, (_, i) => ({
        timestamp: Date.now() - (100 - i) * 86400000,
        open: 100,
        high: 105,
        low: 95,
        close: 100 + i, // Incrementing close prices
        volume: 1000000
      }));
      
      const indicators = engine.calculateAllIndicators(candlesticks);
      
      // Indicators should be calculated from close prices
      expect(indicators.rsi.length).toBeGreaterThan(0);
      expect(indicators.macd.macdLine.length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle extreme price volatility', () => {
      const prices = [100, 200, 50, 300, 25, 400, 10, 500];
      
      // Should not throw, even with extreme volatility
      expect(() => {
        const rsi = engine.calculateRSI(prices.concat(Array(10).fill(100)), 14);
        expect(rsi).toBeDefined();
      }).not.toThrow();
    });

    it('should handle very small price values', () => {
      const prices = Array.from({ length: 30 }, (_, i) => 0.0001 + i * 0.00001);
      
      const sma = engine.calculateSMA(prices, 10);
      
      expect(sma).toBeDefined();
      expect(sma.length).toBeGreaterThan(0);
    });

    it('should handle very large price values', () => {
      const prices = Array.from({ length: 30 }, (_, i) => 1000000 + i * 10000);
      
      const sma = engine.calculateSMA(prices, 10);
      
      expect(sma).toBeDefined();
      expect(sma.length).toBeGreaterThan(0);
    });
  });
});
