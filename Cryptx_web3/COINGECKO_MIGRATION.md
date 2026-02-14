# CoinGecko API Migration

## Overview

The AI Forecasting & Risk Analysis feature has been updated to use the **CoinGecko API** instead of Gate.io API, as Gate.io is blocked in India. This document outlines the changes made and how to use the new implementation.

## Changes Made

### 1. API Client Refactoring

**File**: `apps/api/src/services/gateApiClient.ts`

- **Renamed**: `GateApiClient` → `MarketDataClient` (with backward compatibility alias)
- **Removed**: Gate.io SDK dependency (`gateapi-nodejs`)
- **Added**: Direct HTTP calls to CoinGecko API using `fetch`

### 2. Configuration Changes

**Before** (Gate.io):
```typescript
interface GateApiClientConfig {
  apiKey: string;
  apiSecret: string;
  baseUrl?: string;
}
```

**After** (CoinGecko):
```typescript
interface MarketDataClientConfig {
  baseUrl?: string;  // No API key required for free tier
}
```

### 3. Symbol Mapping

CoinGecko uses different identifiers than Gate.io. A mapping function converts trading pairs:

| Gate.io Format | CoinGecko ID |
|----------------|--------------|
| BTC_USDT       | bitcoin      |
| ETH_USDT       | ethereum     |
| BNB_USDT       | binancecoin  |
| SOL_USDT       | solana       |
| ADA_USDT       | cardano      |
| XRP_USDT       | ripple       |
| DOT_USDT       | polkadot     |
| MATIC_USDT     | polygon      |
| LINK_USDT      | chainlink    |
| UNI_USDT       | uniswap      |
| AVAX_USDT      | avalanche-2  |
| TRX_USDT       | tron         |

### 4. API Endpoints Used

#### Candlestick Data (OHLC)
- **Endpoint**: `/coins/{id}/ohlc?vs_currency=usd&days={days}`
- **Returns**: `[timestamp_ms, open, high, low, close]`
- **Note**: Volume data is not available in CoinGecko OHLC endpoint (set to 0)
- **Limit**: Up to 90 days of historical data

#### Market Statistics
- **Endpoint**: `/coins/markets?vs_currency=usd&ids={coinId}`
- **Returns**: Current price, 24h change, volume, high/low

### 5. Data Structure Differences

**Volume Data**:
- Gate.io: Provides volume in OHLCV data
- CoinGecko: OHLC endpoint doesn't include volume (set to 0 in response)

**Timestamp Format**:
- Gate.io: Unix timestamp in seconds
- CoinGecko: Unix timestamp in milliseconds (converted to seconds)

## Usage

### Basic Usage

```typescript
import { MarketDataClient } from './services/gateApiClient';

// Create client (no API key needed for free tier)
const client = new MarketDataClient();

// Fetch candlestick data
const candlesticks = await client.getCandlesticks(
  'BTC_USDT',
  '1d',
  Math.floor(Date.now() / 1000) - 90 * 86400,  // 90 days ago
  Math.floor(Date.now() / 1000)                 // now
);

// Fetch market statistics
const stats = await client.getMarketStats('BTC_USDT');
```

### Backward Compatibility

The old `GateApiClient` name is still available as an alias:

```typescript
import { GateApiClient } from './services/gateApiClient';

// This still works!
const client = new GateApiClient({});
```

## Error Handling

The implementation maintains the same error handling as before:

- **Rate Limit (429)**: "Rate limit exceeded. Please try again later."
- **Server Error (5xx)**: "Market data service temporarily unavailable. Please try again later."
- **Not Found (404)**: "Symbol {symbol} not found or invalid."
- **Unsupported Symbol**: "Symbol {symbol} not supported. Please use a supported trading pair."

## Testing

All tests have been updated to work with the new CoinGecko implementation:

```bash
cd apps/api
npm test -- gateApiClient.test.ts
```

**Test Results**: ✅ 21/21 tests passing

## Rate Limits

CoinGecko Free Tier:
- **Rate Limit**: 10-50 calls/minute
- **No API Key Required**: For basic endpoints
- **Caching Recommended**: Implement caching to avoid hitting rate limits

## Migration Checklist

- [x] Update API client to use CoinGecko
- [x] Add symbol mapping function
- [x] Update getCandlesticks method
- [x] Update getMarketStats method
- [x] Update all tests
- [x] Maintain backward compatibility
- [x] Document changes
- [ ] Update environment variables (remove Gate.io credentials)
- [ ] Test with real API calls (optional)
- [ ] Update caching strategy if needed

## Next Steps

1. **Task 2.3**: Implement rate limiting and retry logic with exponential backoff
2. **Task 2.4-2.6**: Add property-based tests and unit tests for error handling
3. **Consider**: Adding volume data from a separate CoinGecko endpoint if needed

## Notes

- CoinGecko's free tier is sufficient for development and testing
- For production, consider CoinGecko Pro for higher rate limits
- Volume data is set to 0 in candlestick responses (CoinGecko OHLC limitation)
- If volume data is critical, consider using the market_chart endpoint instead

## References

- [CoinGecko API Documentation](https://www.coingecko.com/en/api/documentation)
- [CoinGecko OHLC Endpoint](https://www.coingecko.com/en/api/documentation)
- [CoinGecko Rate Limits](https://www.coingecko.com/en/api/pricing)
