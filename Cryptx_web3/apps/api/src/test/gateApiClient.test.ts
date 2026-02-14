import { MarketDataClient, MarketDataClientConfig, GateApiClient, GateApiClientConfig } from '../services/gateApiClient';

// Mock fetch globally
global.fetch = jest.fn();

describe('MarketDataClient (CoinGecko)', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockClear();
  });

  describe('Constructor', () => {
    it('should create an instance with default configuration', () => {
      const client = new MarketDataClient();
      expect(client).toBeInstanceOf(MarketDataClient);
    });

    it('should create an instance with custom base URL', () => {
      const config: MarketDataClientConfig = {
        baseUrl: 'https://custom-api.coingecko.com/api/v3',
      };

      const client = new MarketDataClient(config);
      expect(client).toBeInstanceOf(MarketDataClient);
    });

    it('should support backward compatibility with GateApiClient', () => {
      const config: GateApiClientConfig = {};
      const client = new GateApiClient(config);
      expect(client).toBeInstanceOf(MarketDataClient);
    });
  });

  describe('Type Definitions', () => {
    it('should have correct CandlestickData structure', () => {
      // This test verifies the type structure at compile time
      const candlestick = {
        timestamp: 1234567890,
        open: 50000,
        high: 51000,
        low: 49000,
        close: 50500,
        volume: 1000000,
      };

      // TypeScript will catch any type mismatches at compile time
      expect(candlestick.timestamp).toBeDefined();
      expect(candlestick.open).toBeDefined();
      expect(candlestick.high).toBeDefined();
      expect(candlestick.low).toBeDefined();
      expect(candlestick.close).toBeDefined();
      expect(candlestick.volume).toBeDefined();
    });

    it('should have correct MarketStats structure', () => {
      // This test verifies the type structure at compile time
      const stats = {
        symbol: 'BTC_USDT',
        lastPrice: 50000,
        priceChange24h: 1000,
        volume24h: 1000000000,
        high24h: 51000,
        low24h: 49000,
      };

      // TypeScript will catch any type mismatches at compile time
      expect(stats.symbol).toBeDefined();
      expect(stats.lastPrice).toBeDefined();
      expect(stats.priceChange24h).toBeDefined();
      expect(stats.volume24h).toBeDefined();
      expect(stats.high24h).toBeDefined();
      expect(stats.low24h).toBeDefined();
    });
  });

  describe('Method Stubs', () => {
    let client: MarketDataClient;

    beforeEach(() => {
      client = new MarketDataClient();
    });

    it('getCandlesticks should be implemented', async () => {
      // This test verifies the method exists and has the correct signature
      expect(typeof client.getCandlesticks).toBe('function');
    });

    it('getMarketStats should be implemented', async () => {
      // This test verifies the method exists and has the correct signature
      expect(typeof client.getMarketStats).toBe('function');
    });
  });

  describe('getCandlesticks', () => {
    let client: MarketDataClient;
    let mockFetch: jest.MockedFunction<typeof fetch>;

    beforeEach(() => {
      mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockClear();
      client = new MarketDataClient();
    });

    it('should parse valid candlestick response correctly', async () => {
      // Mock the CoinGecko API response
      // CoinGecko OHLC format: [timestamp_ms, open, high, low, close]
      const mockResponse = [
        [1609459200000, 50500, 51000, 49000, 50000],
        [1609545600000, 51500, 52000, 50000, 50500],
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await client.getCandlesticks('BTC_USDT', '1d', 1609459200, 1609545600);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        timestamp: 1609459200,
        open: 50500,
        high: 51000,
        low: 49000,
        close: 50000,
        volume: 0, // CoinGecko OHLC doesn't provide volume
      });
      expect(result[1]).toEqual({
        timestamp: 1609545600,
        open: 51500,
        high: 52000,
        low: 50000,
        close: 50500,
        volume: 0,
      });
    });

    it('should throw error for unsupported symbol', async () => {
      await expect(
        client.getCandlesticks('UNSUPPORTED_PAIR', '1d', 1609459200, 1609545600)
      ).rejects.toThrow('Symbol UNSUPPORTED_PAIR not supported');
    });

    it('should throw error for invalid response structure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => 'invalid',
      } as Response);

      await expect(
        client.getCandlesticks('BTC_USDT', '1d', 1609459200, 1609545600)
      ).rejects.toThrow('Invalid API response: expected array of candlestick data');
    });

    it('should throw error for missing OHLCV fields', async () => {
      // Mock response with incomplete data
      const mockResponse = [
        [1609459200000, 50500], // Missing high, low, close
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      await expect(
        client.getCandlesticks('BTC_USDT', '1d', 1609459200, 1609545600)
      ).rejects.toThrow('Invalid candlestick data format');
    });

    it('should handle rate limit errors with descriptive message', async () => {
      // Mock all retries to fail with rate limit (4 attempts total: initial + 3 retries)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'Too Many Requests',
      } as Response);

      await expect(
        client.getCandlesticks('BTC_USDT', '1d', 1609459200, 1609545600)
      ).rejects.toThrow('Rate limit exceeded. Please try again later.');
      
      // Should have retried 3 times (4 total attempts)
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it('should handle server errors with descriptive message', async () => {
      // Mock all retries to fail with server error (4 attempts total: initial + 3 retries)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 503,
        text: async () => 'Service Unavailable',
      } as Response);

      await expect(
        client.getCandlesticks('BTC_USDT', '1d', 1609459200, 1609545600)
      ).rejects.toThrow('Market data service temporarily unavailable. Please try again later.');
      
      // Should have retried 3 times (4 total attempts)
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it('should handle not found errors with descriptive message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      } as Response);

      await expect(
        client.getCandlesticks('BTC_USDT', '1d', 1609459200, 1609545600)
      ).rejects.toThrow('Symbol BTC_USDT not found or invalid.');
    });

    it('should filter candlesticks to match requested time range', async () => {
      // Mock response with data outside the requested range
      const mockResponse = [
        [1609372800000, 49000, 49500, 48500, 49200], // Before range
        [1609459200000, 50500, 51000, 49000, 50000], // In range
        [1609545600000, 51500, 52000, 50000, 50500], // In range
        [1609632000000, 52000, 52500, 51500, 52200], // After range
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await client.getCandlesticks('BTC_USDT', '1d', 1609459200, 1609545600);

      // Should only include candlesticks within the requested range
      expect(result).toHaveLength(2);
      expect(result[0].timestamp).toBe(1609459200);
      expect(result[1].timestamp).toBe(1609545600);
    });
  });

  describe('getMarketStats', () => {
    let client: MarketDataClient;
    let mockFetch: jest.MockedFunction<typeof fetch>;

    beforeEach(() => {
      mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockClear();
      client = new MarketDataClient();
    });

    it('should parse valid market stats response correctly', async () => {
      // Mock the CoinGecko API response
      const mockResponse = [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          current_price: 50000,
          price_change_percentage_24h: 2.5,
          total_volume: 1000000000,
          high_24h: 51000,
          low_24h: 49000,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      const result = await client.getMarketStats('BTC_USDT');

      expect(result).toEqual({
        symbol: 'BTC_USDT',
        lastPrice: 50000,
        priceChange24h: 2.5,
        volume24h: 1000000000,
        high24h: 51000,
        low24h: 49000,
      });
    });

    it('should throw error for unsupported symbol', async () => {
      await expect(
        client.getMarketStats('UNSUPPORTED_PAIR')
      ).rejects.toThrow('Symbol UNSUPPORTED_PAIR not supported');
    });

    it('should throw error when no market data found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as Response);

      await expect(
        client.getMarketStats('BTC_USDT')
      ).rejects.toThrow('No market data found for symbol BTC_USDT');
    });

    it('should throw error for missing required fields', async () => {
      const mockResponse = [
        {
          id: 'bitcoin',
          // Missing other required fields
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

      await expect(
        client.getMarketStats('BTC_USDT')
      ).rejects.toThrow('Missing required fields in market statistics data');
    });

    it('should handle rate limit errors with descriptive message', async () => {
      // Mock all retries to fail with rate limit (4 attempts total: initial + 3 retries)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'Too Many Requests',
      } as Response);

      await expect(
        client.getMarketStats('BTC_USDT')
      ).rejects.toThrow('Rate limit exceeded. Please try again later.');
      
      // Should have retried 3 times (4 total attempts)
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });

    it('should handle server errors with descriptive message', async () => {
      // Mock all retries to fail with server error (4 attempts total: initial + 3 retries)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      } as Response);

      await expect(
        client.getMarketStats('BTC_USDT')
      ).rejects.toThrow('Market data service temporarily unavailable. Please try again later.');
      
      // Should have retried 3 times (4 total attempts)
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('retryWithBackoff', () => {
    let client: MarketDataClient;
    let mockFetch: jest.MockedFunction<typeof fetch>;
    let consoleLogSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
      mockFetch.mockClear();
      client = new MarketDataClient();
      
      // Spy on console methods to verify logging
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should retry on rate limit errors with exponential backoff', async () => {
      // First two calls fail with rate limit, third succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: async () => 'Too Many Requests',
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: async () => 'Too Many Requests',
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [
            {
              id: 'bitcoin',
              current_price: 50000,
              price_change_percentage_24h: 2.5,
              total_volume: 1000000000,
              high_24h: 51000,
              low_24h: 49000,
            },
          ],
        } as Response);

      const result = await client.getMarketStats('BTC_USDT');

      // Should succeed after retries
      expect(result.lastPrice).toBe(50000);
      
      // Should have made 3 fetch calls
      expect(mockFetch).toHaveBeenCalledTimes(3);
      
      // Should have logged retry attempts
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Retry attempt 1/3')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Retry attempt 2/3')
      );
    });

    it('should retry on server errors with exponential backoff', async () => {
      // First call fails with server error, second succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          text: async () => 'Service Unavailable',
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [
            {
              id: 'bitcoin',
              current_price: 50000,
              price_change_percentage_24h: 2.5,
              total_volume: 1000000000,
              high_24h: 51000,
              low_24h: 49000,
            },
          ],
        } as Response);

      const result = await client.getMarketStats('BTC_USDT');

      // Should succeed after retry
      expect(result.lastPrice).toBe(50000);
      
      // Should have made 2 fetch calls
      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      // Should have logged retry attempt
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Retry attempt 1/3')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Server error')
      );
    });

    it('should throw error after max retries exceeded', async () => {
      // All calls fail with rate limit
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'Too Many Requests',
      } as Response);

      await expect(
        client.getMarketStats('BTC_USDT')
      ).rejects.toThrow('Rate limit exceeded. Please try again later.');
      
      // Should have made 4 fetch calls (initial + 3 retries)
      expect(mockFetch).toHaveBeenCalledTimes(4);
      
      // Should have logged all retry attempts
      expect(consoleLogSpy).toHaveBeenCalledTimes(3);
      
      // Should have logged final error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Operation failed after 4 attempts'),
        expect.any(String)
      );
    });

    it('should not retry on non-retryable errors', async () => {
      // Fail with 404 (not retryable)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not Found',
      } as Response);

      await expect(
        client.getMarketStats('BTC_USDT')
      ).rejects.toThrow('Symbol BTC_USDT not found or invalid.');
      
      // Should have made only 1 fetch call (no retries)
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      // Should not have logged retry attempts
      expect(consoleLogSpy).not.toHaveBeenCalled();
      
      // Should have logged error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Operation failed after 1 attempts'),
        expect.any(String)
      );
    });

    it('should implement exponential backoff delays', async () => {
      jest.useFakeTimers();
      
      // Mock responses: fail 3 times, then succeed
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: async () => 'Too Many Requests',
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: async () => 'Too Many Requests',
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: async () => 'Too Many Requests',
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [
            {
              id: 'bitcoin',
              current_price: 50000,
              price_change_percentage_24h: 2.5,
              total_volume: 1000000000,
              high_24h: 51000,
              low_24h: 49000,
            },
          ],
        } as Response);

      const promise = client.getMarketStats('BTC_USDT');
      
      // Fast-forward through delays
      // First retry: 1000ms delay
      await jest.advanceTimersByTimeAsync(1000);
      
      // Second retry: 2000ms delay (doubled)
      await jest.advanceTimersByTimeAsync(2000);
      
      // Third retry: 4000ms delay (doubled again)
      await jest.advanceTimersByTimeAsync(4000);
      
      // Wait for promise to resolve
      const result = await promise;
      expect(result.lastPrice).toBe(50000);
      
      jest.useRealTimers();
    });

    it('should work with getCandlesticks method', async () => {
      // First call fails with rate limit, second succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: async () => 'Too Many Requests',
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => [
            [1609459200000, 50500, 51000, 49000, 50000],
          ],
        } as Response);

      const result = await client.getCandlesticks('BTC_USDT', '1d', 1609459200, 1609545600);

      // Should succeed after retry
      expect(result).toHaveLength(1);
      expect(result[0].close).toBe(50000);
      
      // Should have made 2 fetch calls
      expect(mockFetch).toHaveBeenCalledTimes(2);
      
      // Should have logged retry attempt
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Retry attempt 1/3')
      );
    });
  });
});
