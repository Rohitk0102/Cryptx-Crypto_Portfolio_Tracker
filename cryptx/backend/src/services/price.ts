import axios from 'axios'
import { cache } from '../utils/redis'

interface TokenPrice {
  usd: number
  usd_24h_change?: number
  usd_market_cap?: number
}

interface PriceData {
  [tokenId: string]: TokenPrice
}

export class PriceService {
  private baseUrl: string
  private apiKey: string
  private cacheTTL: number = 30 // 30 seconds

  constructor() {
    this.baseUrl = 'https://api.coingecko.com/api/v3'
    this.apiKey = process.env.COINGECKO_API_KEY || ''
  }

  async getTokenPrices(tokenIds: string[]): Promise<PriceData> {
    try {
      // Check cache first
      const cacheKey = `prices:${tokenIds.sort().join(',')}`
      const cached = await cache.get(cacheKey)
      
      if (cached) {
        return JSON.parse(cached)
      }

      // Fetch from CoinGecko
      const params: any = {
        ids: tokenIds.join(','),
        vs_currencies: 'usd',
        include_24hr_change: 'true',
        include_market_cap: 'true'
      }

      if (this.apiKey) {
        params.x_cg_pro_api_key = this.apiKey
      }

      const response = await axios.get(`${this.baseUrl}/simple/price`, {
        params,
        timeout: 10000
      })

      const prices: PriceData = {}
      for (const [tokenId, data] of Object.entries(response.data)) {
        prices[tokenId] = data as TokenPrice
      }

      // Cache the result
      await cache.set(cacheKey, JSON.stringify(prices), this.cacheTTL)

      return prices
    } catch (error) {
      console.error('Error fetching token prices:', error)
      return {}
    }
  }

  async getTokenPrice(tokenId: string): Promise<number> {
    try {
      const prices = await this.getTokenPrices([tokenId])
      return prices[tokenId]?.usd || 0
    } catch (error) {
      console.error(`Error fetching price for ${tokenId}:`, error)
      return 0
    }
  }

  // Map common symbols to CoinGecko IDs
  symbolToId(symbol: string): string {
    const mapping: Record<string, string> = {
      'ETH': 'ethereum',
      'MATIC': 'matic-network',
      'BNB': 'binancecoin',
      'USDT': 'tether',
      'USDC': 'usd-coin',
      'DAI': 'dai',
      'WETH': 'weth',
      'WBTC': 'wrapped-bitcoin',
      'LINK': 'chainlink',
      'UNI': 'uniswap',
      'AAVE': 'aave',
      'COMP': 'compound-governance-token'
    }
    return mapping[symbol.toUpperCase()] || symbol.toLowerCase()
  }
}

export const priceService = new PriceService()
