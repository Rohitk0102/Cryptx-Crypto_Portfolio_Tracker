/**
 * Unit tests for RiskAnalyzer
 * 
 * Tests risk analysis functionality including volatility calculations,
 * risk scoring, sentiment analysis, and recommendations.
 */

import { RiskAnalyzer } from '../services/riskAnalyzer';
import { CandlestickData, TechnicalIndicators } from '../services/technicalAnalysis';

describe('RiskAnalyzer', () => {
  let analyzer: RiskAnalyzer;

  beforeEach(() => {
    analyzer = new RiskAnalyzer();
  });

  // Helper function to create mock candlestick data
  function createMockCandlesticks(prices: number[]): CandlestickData[] {
    return prices.map((price, i) => ({
      timestamp: Date.now() - (prices.length - i) * 86400000,
      open: price * 0.99,
      high: price * 1.02,
      low: price * 0.98,
      close: price,
      volume: 1000000 + Math.random() * 500000
    }));
  }

  // Helper function to create mock technical indicators
  function createMockIndicators(length: number): TechnicalIndicators {
    const rsi = Array(length).fill(0).map(() => 50 + Math.random() * 20 - 10);
    const macdLength = Math.max(1, length - 34); // MACD needs more data
    
    return {
      rsi,
      macd: {
        macdLine: Array(macdLength).fill(0).map(() => Math.random() * 10 - 5),
        signalLine: Array(macdLength).fill(0).map(() => Math.random() * 10 - 5),
        histogram: Array(macdLength).fill(0).map(() => Math.random() * 5 - 2.5)
      },
      bollingerBands: {
        upper: Array(length).fill(0).map((_, i) => 100 + i * 0.5 + 5),
        middle: Array(length).fill(0).map((_, i) => 100 + i * 0.5),
        lower: Array(length).fill(0).map((_, i) => 100 + i * 0.5 - 5)
      },
      movingAverages: {
        sma7: Array(length).fill(0).map((_, i) => 100 + i * 0.5),
        sma30: Array(length).fill(0).map((_, i) => 100 + i * 0.4),
        sma90: Array(length).fill(0).map((_, i) => 100 + i * 0.3)
      }
    };
  }

  describe('analyzeRisk', () => {
    it('should return complete risk analysis with all required fields', () => {
      const prices = Array(90).fill(0).map((_, i) => 100 + i * 0.5);
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(90);

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      expect(result).toHaveProperty('riskScore');
      expect(result).toHaveProperty('riskCategory');
      expect(result).toHaveProperty('volatility');
      expect(result).toHaveProperty('sentiment');
      expect(result).toHaveProperty('maxDrawdown');
      expect(result).toHaveProperty('recommendations');
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should calculate risk score between 0 and 100', () => {
      const prices = Array(90).fill(0).map((_, i) => 100 + Math.random() * 20);
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(90);

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
    });

    it('should classify high volatility as high risk', () => {
      // Create highly volatile prices
      const prices = Array(90).fill(0).map((_, i) => 100 + Math.sin(i * 0.5) * 50);
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(90);

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      // High volatility should result in higher risk score
      expect(result.riskScore).toBeGreaterThan(40);
    });

    it('should classify stable prices as lower risk', () => {
      // Create stable prices with minimal variation
      const prices = Array(90).fill(0).map((_, i) => 100 + i * 0.1);
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(90);

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      // Stable prices should result in lower risk score
      expect(result.riskScore).toBeLessThan(60);
    });
  });

  describe('volatility calculations', () => {
    it('should calculate volatility metrics for all time periods', () => {
      const prices = Array(90).fill(0).map((_, i) => 100 + Math.random() * 10);
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(90);

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      expect(result.volatility).toHaveProperty('daily');
      expect(result.volatility).toHaveProperty('weekly');
      expect(result.volatility).toHaveProperty('monthly');
      expect(result.volatility).toHaveProperty('annualized');
      
      // All volatility values should be positive
      expect(result.volatility.daily).toBeGreaterThan(0);
      expect(result.volatility.weekly).toBeGreaterThan(0);
      expect(result.volatility.monthly).toBeGreaterThan(0);
      expect(result.volatility.annualized).toBeGreaterThan(0);
      
      // Annualized should be larger than monthly, which should be larger than weekly
      expect(result.volatility.annualized).toBeGreaterThan(result.volatility.monthly);
      expect(result.volatility.monthly).toBeGreaterThan(result.volatility.weekly);
      expect(result.volatility.weekly).toBeGreaterThan(result.volatility.daily);
    });

    it('should calculate zero volatility for constant prices', () => {
      const prices = Array(90).fill(100);
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(90);

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      // Constant prices should have zero volatility
      expect(result.volatility.daily).toBe(0);
      expect(result.volatility.weekly).toBe(0);
      expect(result.volatility.monthly).toBe(0);
      expect(result.volatility.annualized).toBe(0);
    });

    it('should express volatility as percentages', () => {
      const prices = Array(90).fill(0).map((_, i) => 100 + Math.random() * 20);
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(90);

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      // Volatility should be expressed as percentages (reasonable range for crypto)
      expect(result.volatility.daily).toBeGreaterThan(0);
      expect(result.volatility.daily).toBeLessThan(50); // Daily volatility rarely exceeds 50%
    });
  });

  describe('maximum drawdown calculation', () => {
    it('should calculate maximum drawdown correctly', () => {
      // Create prices with a clear drawdown: peak at 150, trough at 100
      const prices = [100, 120, 150, 140, 120, 100, 110, 130];
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(prices.length);

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      // Max drawdown should be (100 - 150) / 150 = -33.33%
      expect(result.maxDrawdown).toBeCloseTo(-33.33, 1);
    });

    it('should return zero drawdown for continuously rising prices', () => {
      const prices = Array(90).fill(0).map((_, i) => 100 + i);
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(90);

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      // No drawdown for continuously rising prices
      expect(result.maxDrawdown).toBe(0);
    });

    it('should express drawdown as negative percentage', () => {
      const prices = [100, 150, 120, 100, 80];
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(prices.length);

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      // Drawdown should be negative
      expect(result.maxDrawdown).toBeLessThan(0);
    });
  });

  describe('risk classification', () => {
    it('should classify risk score > 70 as High Risk', () => {
      // Create highly volatile prices to generate high risk score
      const prices = Array(90).fill(0).map((_, i) => 100 + Math.sin(i * 0.3) * 80);
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(90);

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      if (result.riskScore > 70) {
        expect(result.riskCategory).toBe('High Risk');
      }
    });

    it('should classify risk score 40-70 as Medium Risk', () => {
      // Create moderately volatile prices
      const prices = Array(90).fill(0).map((_, i) => 100 + Math.sin(i * 0.2) * 15);
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(90);

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      if (result.riskScore >= 40 && result.riskScore <= 70) {
        expect(result.riskCategory).toBe('Medium Risk');
      }
    });

    it('should classify risk score < 40 as Low Risk', () => {
      // Create stable prices
      const prices = Array(90).fill(0).map((_, i) => 100 + i * 0.05);
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(90);

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      if (result.riskScore < 40) {
        expect(result.riskCategory).toBe('Low Risk');
      }
    });

    it('should flag annualized volatility > 100% as High Risk', () => {
      // Create extremely volatile prices
      const prices = Array(90).fill(0).map((_, i) => 100 + Math.sin(i * 0.5) * 90);
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(90);

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      if (result.volatility.annualized > 100) {
        expect(result.riskCategory).toBe('High Risk');
      }
    });
  });

  describe('sentiment analysis', () => {
    it('should classify RSI > 70 as overbought', () => {
      const prices = Array(90).fill(0).map((_, i) => 100 + i * 2);
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(90);
      
      // Set RSI to overbought
      indicators.rsi[indicators.rsi.length - 1] = 75;

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      expect(result.sentiment.signals.rsi).toBe('overbought');
    });

    it('should classify RSI < 30 as oversold', () => {
      const prices = Array(90).fill(0).map((_, i) => 100 - i * 0.5);
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(90);
      
      // Set RSI to oversold
      indicators.rsi[indicators.rsi.length - 1] = 25;

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      expect(result.sentiment.signals.rsi).toBe('oversold');
    });

    it('should classify RSI 30-70 as neutral', () => {
      const prices = Array(90).fill(100);
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(90);
      
      // Set RSI to neutral range
      indicators.rsi[indicators.rsi.length - 1] = 50;

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      expect(result.sentiment.signals.rsi).toBe('neutral');
    });

    it('should detect bullish MACD crossover', () => {
      const prices = Array(90).fill(0).map((_, i) => 100 + i * 0.5);
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(90);
      
      // Set up bullish crossover: MACD crosses above signal
      const len = indicators.macd.macdLine.length;
      indicators.macd.macdLine[len - 2] = -1;
      indicators.macd.signalLine[len - 2] = 0;
      indicators.macd.macdLine[len - 1] = 1;
      indicators.macd.signalLine[len - 1] = 0;

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      expect(result.sentiment.signals.macd).toBe('bullish');
    });

    it('should detect bearish MACD crossover', () => {
      const prices = Array(90).fill(0).map((_, i) => 100 - i * 0.5);
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(90);
      
      // Set up bearish crossover: MACD crosses below signal
      const len = indicators.macd.macdLine.length;
      indicators.macd.macdLine[len - 2] = 1;
      indicators.macd.signalLine[len - 2] = 0;
      indicators.macd.macdLine[len - 1] = -1;
      indicators.macd.signalLine[len - 1] = 0;

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      expect(result.sentiment.signals.macd).toBe('bearish');
    });

    it('should detect price above upper Bollinger Band as overbought', () => {
      const prices = Array(90).fill(0).map((_, i) => 100 + i * 0.5);
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(90);
      
      // Set current price above upper band
      const currentPrice = prices[prices.length - 1];
      indicators.bollingerBands.upper[indicators.bollingerBands.upper.length - 1] = currentPrice - 5;

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      expect(result.sentiment.signals.bollingerBands).toBe('overbought');
    });

    it('should detect price below lower Bollinger Band as oversold', () => {
      const prices = Array(90).fill(0).map((_, i) => 100 - i * 0.5);
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(90);
      
      // Set current price below lower band
      const currentPrice = prices[prices.length - 1];
      indicators.bollingerBands.lower[indicators.bollingerBands.lower.length - 1] = currentPrice + 5;

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      expect(result.sentiment.signals.bollingerBands).toBe('oversold');
    });

    it('should classify overall sentiment as Bullish when majority signals are bullish', () => {
      const prices = Array(90).fill(0).map((_, i) => 100 + i * 0.5);
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(90);
      
      // Set up bullish signals
      indicators.rsi[indicators.rsi.length - 1] = 25; // Oversold (bullish reversal)
      const len = indicators.macd.macdLine.length;
      indicators.macd.macdLine[len - 1] = 1;
      indicators.macd.signalLine[len - 1] = 0; // MACD above signal (bullish)

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      expect(result.sentiment.classification).toBe('Bullish');
    });

    it('should classify overall sentiment as Bearish when majority signals are bearish', () => {
      const prices = Array(90).fill(0).map((_, i) => 100 - i * 0.5);
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(90);
      
      // Set up bearish signals
      indicators.rsi[indicators.rsi.length - 1] = 75; // Overbought (bearish reversal)
      const len = indicators.macd.macdLine.length;
      indicators.macd.macdLine[len - 1] = -1;
      indicators.macd.signalLine[len - 1] = 0; // MACD below signal (bearish)

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      expect(result.sentiment.classification).toBe('Bearish');
    });

    it('should classify overall sentiment as Neutral when signals are mixed', () => {
      const prices = Array(90).fill(100);
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(90);
      
      // Set up neutral/mixed signals
      indicators.rsi[indicators.rsi.length - 1] = 50; // Neutral RSI
      
      // Set MACD to neutral (equal values, no crossover)
      const len = indicators.macd.macdLine.length;
      indicators.macd.macdLine[len - 1] = 0;
      indicators.macd.signalLine[len - 1] = 0;
      indicators.macd.macdLine[len - 2] = 0;
      indicators.macd.signalLine[len - 2] = 0;
      
      // Set Bollinger Bands to neutral (price in middle)
      const currentPrice = prices[prices.length - 1];
      indicators.bollingerBands.upper[indicators.bollingerBands.upper.length - 1] = currentPrice + 5;
      indicators.bollingerBands.lower[indicators.bollingerBands.lower.length - 1] = currentPrice - 5;

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      expect(result.sentiment.classification).toBe('Neutral');
    });
  });

  describe('recommendations', () => {
    it('should generate recommendations array', () => {
      const prices = Array(90).fill(0).map((_, i) => 100 + Math.random() * 10);
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(90);

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should include high risk warning for High Risk assets', () => {
      // Create highly volatile prices
      const prices = Array(90).fill(0).map((_, i) => 100 + Math.sin(i * 0.5) * 80);
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(90);

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      if (result.riskCategory === 'High Risk') {
        const hasHighRiskWarning = result.recommendations.some(rec => 
          rec.includes('HIGH RISK') || rec.includes('⚠️')
        );
        expect(hasHighRiskWarning).toBe(true);
      }
    });

    it('should include sentiment-based recommendations', () => {
      const prices = Array(90).fill(0).map((_, i) => 100 + i * 0.5);
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(90);

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      const hasSentimentRec = result.recommendations.some(rec => 
        rec.includes('BULLISH') || rec.includes('BEARISH') || rec.includes('NEUTRAL')
      );
      expect(hasSentimentRec).toBe(true);
    });

    it('should include risk management advice', () => {
      const prices = Array(90).fill(0).map((_, i) => 100 + Math.random() * 10);
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(90);

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      const hasRiskManagement = result.recommendations.some(rec => 
        rec.includes('RISK MANAGEMENT') || rec.includes('position sizing') || rec.includes('stop-loss')
      );
      expect(hasRiskManagement).toBe(true);
    });

    it('should warn about extreme volatility when annualized > 100%', () => {
      // Create extremely volatile prices
      const prices = Array(90).fill(0).map((_, i) => 100 + Math.sin(i * 0.5) * 90);
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(90);

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      if (result.volatility.annualized > 100) {
        const hasVolatilityWarning = result.recommendations.some(rec => 
          rec.includes('EXTREME VOLATILITY') || rec.includes('100%')
        );
        expect(hasVolatilityWarning).toBe(true);
      }
    });

    it('should warn about large drawdowns', () => {
      // Create prices with significant drawdown
      const prices = [100, 150, 120, 90, 70, 80, 100];
      const candlesticks = createMockCandlesticks(prices);
      const indicators = createMockIndicators(prices.length);

      const result = analyzer.analyzeRisk(candlesticks, indicators);

      if (result.maxDrawdown < -30) {
        const hasDrawdownWarning = result.recommendations.some(rec => 
          rec.includes('DRAWDOWN') || rec.includes('drawdown')
        );
        expect(hasDrawdownWarning).toBe(true);
      }
    });
  });
});
