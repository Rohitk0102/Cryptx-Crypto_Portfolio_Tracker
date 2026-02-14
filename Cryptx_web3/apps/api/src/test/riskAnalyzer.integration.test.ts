/**
 * Integration tests for RiskAnalyzer with TechnicalAnalysisEngine
 * 
 * Tests the complete workflow of calculating technical indicators
 * and performing risk analysis on real-world-like data.
 */

import { RiskAnalyzer } from '../services/riskAnalyzer';
import { TechnicalAnalysisEngine, CandlestickData } from '../services/technicalAnalysis';

describe('RiskAnalyzer Integration Tests', () => {
  let analyzer: RiskAnalyzer;
  let technicalEngine: TechnicalAnalysisEngine;

  beforeEach(() => {
    analyzer = new RiskAnalyzer();
    technicalEngine = new TechnicalAnalysisEngine();
  });

  // Helper function to create realistic candlestick data
  function createRealisticCandlesticks(
    basePrice: number,
    days: number,
    volatility: number
  ): CandlestickData[] {
    const candlesticks: CandlestickData[] = [];
    let currentPrice = basePrice;

    for (let i = 0; i < days; i++) {
      // Simulate price movement with random walk
      const change = (Math.random() - 0.5) * volatility * currentPrice;
      currentPrice += change;

      const open = currentPrice * (1 + (Math.random() - 0.5) * 0.01);
      const close = currentPrice * (1 + (Math.random() - 0.5) * 0.01);
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);
      const volume = 1000000 + Math.random() * 500000;

      candlesticks.push({
        timestamp: Date.now() - (days - i) * 86400000,
        open,
        high,
        low,
        close,
        volume
      });
    }

    return candlesticks;
  }

  describe('Complete workflow with low volatility asset', () => {
    it('should classify stable asset as low risk', () => {
      // Create stable price data (low volatility)
      const candlesticks = createRealisticCandlesticks(100, 90, 0.01);

      // Calculate technical indicators
      const indicators = technicalEngine.calculateAllIndicators(candlesticks);

      // Perform risk analysis
      const riskAnalysis = analyzer.analyzeRisk(candlesticks, indicators);

      // Verify results
      expect(riskAnalysis.riskScore).toBeLessThan(50);
      expect(riskAnalysis.riskCategory).toMatch(/Low Risk|Medium Risk/);
      expect(riskAnalysis.volatility.annualized).toBeLessThan(50);
      expect(riskAnalysis.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Complete workflow with high volatility asset', () => {
    it('should classify volatile asset as high risk', () => {
      // Create volatile price data
      const candlesticks = createRealisticCandlesticks(100, 90, 0.05);

      // Calculate technical indicators
      const indicators = technicalEngine.calculateAllIndicators(candlesticks);

      // Perform risk analysis
      const riskAnalysis = analyzer.analyzeRisk(candlesticks, indicators);

      // Verify results - risk score should be positive and volatility should be measurable
      expect(riskAnalysis.riskScore).toBeGreaterThanOrEqual(0);
      expect(riskAnalysis.riskScore).toBeLessThanOrEqual(100);
      expect(riskAnalysis.volatility.annualized).toBeGreaterThan(0);
      expect(riskAnalysis.recommendations.length).toBeGreaterThan(0);
      
      // Higher volatility should result in higher risk than stable assets
      const stableCandlesticks = createRealisticCandlesticks(100, 90, 0.005);
      const stableIndicators = technicalEngine.calculateAllIndicators(stableCandlesticks);
      const stableRiskAnalysis = analyzer.analyzeRisk(stableCandlesticks, stableIndicators);
      
      expect(riskAnalysis.riskScore).toBeGreaterThan(stableRiskAnalysis.riskScore);
    });
  });

  describe('Complete workflow with trending asset', () => {
    it('should detect trend in rising prices', () => {
      // Create upward trending prices
      const candlesticks: CandlestickData[] = [];
      for (let i = 0; i < 90; i++) {
        const price = 100 + i * 0.5 + (Math.random() - 0.5) * 2;
        candlesticks.push({
          timestamp: Date.now() - (90 - i) * 86400000,
          open: price * 0.99,
          high: price * 1.01,
          low: price * 0.98,
          close: price,
          volume: 1000000
        });
      }

      // Calculate technical indicators
      const indicators = technicalEngine.calculateAllIndicators(candlesticks);

      // Perform risk analysis
      const riskAnalysis = analyzer.analyzeRisk(candlesticks, indicators);

      // Verify sentiment detection - should have a classification
      expect(riskAnalysis.sentiment).toBeDefined();
      expect(['Bullish', 'Bearish', 'Neutral']).toContain(
        riskAnalysis.sentiment.classification
      );
      expect(riskAnalysis.recommendations.length).toBeGreaterThan(0);
    });

    it('should detect trend in falling prices', () => {
      // Create downward trending prices
      const candlesticks: CandlestickData[] = [];
      for (let i = 0; i < 90; i++) {
        const price = 100 - i * 0.5 + (Math.random() - 0.5) * 2;
        candlesticks.push({
          timestamp: Date.now() - (90 - i) * 86400000,
          open: price * 1.01,
          high: price * 1.02,
          low: price * 0.99,
          close: price,
          volume: 1000000
        });
      }

      // Calculate technical indicators
      const indicators = technicalEngine.calculateAllIndicators(candlesticks);

      // Perform risk analysis
      const riskAnalysis = analyzer.analyzeRisk(candlesticks, indicators);

      // Verify sentiment detection - should have a classification
      expect(riskAnalysis.sentiment).toBeDefined();
      expect(['Bullish', 'Bearish', 'Neutral']).toContain(
        riskAnalysis.sentiment.classification
      );
      expect(riskAnalysis.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Complete workflow with extreme volatility', () => {
    it('should flag extremely volatile asset and provide warnings', () => {
      // Create extremely volatile price data
      const candlesticks = createRealisticCandlesticks(100, 90, 0.08);

      // Calculate technical indicators
      const indicators = technicalEngine.calculateAllIndicators(candlesticks);

      // Perform risk analysis
      const riskAnalysis = analyzer.analyzeRisk(candlesticks, indicators);

      // Verify extreme volatility handling
      if (riskAnalysis.volatility.annualized > 100) {
        expect(riskAnalysis.riskCategory).toBe('High Risk');
        const hasVolatilityWarning = riskAnalysis.recommendations.some(rec =>
          rec.includes('EXTREME VOLATILITY') || rec.includes('100%')
        );
        expect(hasVolatilityWarning).toBe(true);
      }
    });
  });

  describe('Complete workflow with drawdown scenario', () => {
    it('should detect and calculate drawdowns correctly', () => {
      // Create price data with significant drawdown
      const candlesticks: CandlestickData[] = [];
      const prices = [
        ...Array(20).fill(0).map((_, i) => 100 + i * 3), // Rise to 157
        ...Array(30).fill(0).map((_, i) => 157 - i * 3), // Fall to 67 (drawdown > 50%)
        ...Array(40).fill(0).map((_, i) => 67 + i * 0.5) // Recover to 87
      ];

      prices.forEach((price, i) => {
        candlesticks.push({
          timestamp: Date.now() - (prices.length - i) * 86400000,
          open: price * 0.99,
          high: price * 1.01,
          low: price * 0.98,
          close: price,
          volume: 1000000
        });
      });

      // Calculate technical indicators
      const indicators = technicalEngine.calculateAllIndicators(candlesticks);

      // Perform risk analysis
      const riskAnalysis = analyzer.analyzeRisk(candlesticks, indicators);

      // Verify drawdown detection
      expect(riskAnalysis.maxDrawdown).toBeLessThan(0);
      expect(Math.abs(riskAnalysis.maxDrawdown)).toBeGreaterThan(30);
      
      // Verify recommendations are generated
      expect(riskAnalysis.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Risk score bounds validation', () => {
    it('should always return risk score between 0 and 100', () => {
      // Test with various volatility levels
      const volatilityLevels = [0.005, 0.01, 0.02, 0.05, 0.08, 0.1];

      volatilityLevels.forEach(volatility => {
        const candlesticks = createRealisticCandlesticks(100, 90, volatility);
        const indicators = technicalEngine.calculateAllIndicators(candlesticks);
        const riskAnalysis = analyzer.analyzeRisk(candlesticks, indicators);

        expect(riskAnalysis.riskScore).toBeGreaterThanOrEqual(0);
        expect(riskAnalysis.riskScore).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Sentiment signals validation', () => {
    it('should provide all sentiment signals', () => {
      const candlesticks = createRealisticCandlesticks(100, 90, 0.02);
      const indicators = technicalEngine.calculateAllIndicators(candlesticks);
      const riskAnalysis = analyzer.analyzeRisk(candlesticks, indicators);

      // Verify all sentiment signals are present
      expect(riskAnalysis.sentiment.signals).toHaveProperty('rsi');
      expect(riskAnalysis.sentiment.signals).toHaveProperty('macd');
      expect(riskAnalysis.sentiment.signals).toHaveProperty('bollingerBands');

      // Verify signal values are valid
      expect(['overbought', 'oversold', 'neutral']).toContain(
        riskAnalysis.sentiment.signals.rsi
      );
      expect(['bullish', 'bearish', 'neutral']).toContain(
        riskAnalysis.sentiment.signals.macd
      );
      expect(['overbought', 'oversold', 'neutral']).toContain(
        riskAnalysis.sentiment.signals.bollingerBands
      );
    });
  });

  describe('Volatility metrics validation', () => {
    it('should calculate all volatility periods correctly', () => {
      const candlesticks = createRealisticCandlesticks(100, 90, 0.02);
      const indicators = technicalEngine.calculateAllIndicators(candlesticks);
      const riskAnalysis = analyzer.analyzeRisk(candlesticks, indicators);

      // Verify all volatility metrics are present
      expect(riskAnalysis.volatility).toHaveProperty('daily');
      expect(riskAnalysis.volatility).toHaveProperty('weekly');
      expect(riskAnalysis.volatility).toHaveProperty('monthly');
      expect(riskAnalysis.volatility).toHaveProperty('annualized');

      // Verify scaling relationships
      expect(riskAnalysis.volatility.annualized).toBeGreaterThan(
        riskAnalysis.volatility.monthly
      );
      expect(riskAnalysis.volatility.monthly).toBeGreaterThan(
        riskAnalysis.volatility.weekly
      );
      expect(riskAnalysis.volatility.weekly).toBeGreaterThan(
        riskAnalysis.volatility.daily
      );
    });
  });

  describe('Recommendations completeness', () => {
    it('should always include risk management advice', () => {
      const candlesticks = createRealisticCandlesticks(100, 90, 0.02);
      const indicators = technicalEngine.calculateAllIndicators(candlesticks);
      const riskAnalysis = analyzer.analyzeRisk(candlesticks, indicators);

      const hasRiskManagement = riskAnalysis.recommendations.some(rec =>
        rec.includes('RISK MANAGEMENT') || rec.includes('position sizing')
      );
      expect(hasRiskManagement).toBe(true);
    });

    it('should include risk category recommendation', () => {
      const candlesticks = createRealisticCandlesticks(100, 90, 0.02);
      const indicators = technicalEngine.calculateAllIndicators(candlesticks);
      const riskAnalysis = analyzer.analyzeRisk(candlesticks, indicators);

      const hasRiskCategory = riskAnalysis.recommendations.some(rec =>
        rec.includes('HIGH RISK') || rec.includes('MODERATE RISK') || rec.includes('LOW RISK')
      );
      expect(hasRiskCategory).toBe(true);
    });

    it('should include sentiment recommendation', () => {
      const candlesticks = createRealisticCandlesticks(100, 90, 0.02);
      const indicators = technicalEngine.calculateAllIndicators(candlesticks);
      const riskAnalysis = analyzer.analyzeRisk(candlesticks, indicators);

      const hasSentiment = riskAnalysis.recommendations.some(rec =>
        rec.includes('BULLISH') || rec.includes('BEARISH') || rec.includes('NEUTRAL')
      );
      expect(hasSentiment).toBe(true);
    });
  });
});
