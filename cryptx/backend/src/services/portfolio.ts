import { blockchainService } from './blockchain'
import { priceService } from './price'
import { PortfolioHistory } from '../models'

interface PortfolioData {
  walletAddress: string
  chainId: number
  totalValue: number
  tokens: Array<{
    symbol: string
    name: string
    balance: string
    decimals: number
    usdValue: number
    percentage: number
    logo: string
    contractAddress: string
    priceChange24h?: number
  }>
  lastUpdated: Date
}

export class PortfolioService {
  async getPortfolio(address: string, chainId: number): Promise<PortfolioData> {
    try {
      // Fetch token balances from blockchain
      const tokens = await blockchainService.getTokenBalances(address, chainId)

      // Get token IDs for price fetching
      const tokenIds = tokens.map(t => priceService.symbolToId(t.symbol))

      // Fetch prices
      const prices = await priceService.getTokenPrices(tokenIds)

      // Calculate USD values
      let totalValue = 0
      const tokensWithPrices = tokens.map((token, index) => {
        const tokenId = tokenIds[index]
        const price = prices[tokenId]?.usd || 0
        const priceChange24h = prices[tokenId]?.usd_24h_change
        const usdValue = parseFloat(token.balance) * price
        totalValue += usdValue

        return {
          ...token,
          usdValue,
          priceChange24h
        }
      })

      // Calculate percentages
      const tokensWithPercentages = tokensWithPrices.map(token => ({
        ...token,
        percentage: totalValue > 0 ? (token.usdValue / totalValue) * 100 : 0
      }))

      // Sort by USD value (highest first)
      tokensWithPercentages.sort((a, b) => b.usdValue - a.usdValue)

      const portfolioData: PortfolioData = {
        walletAddress: address.toLowerCase(),
        chainId,
        totalValue,
        tokens: tokensWithPercentages,
        lastUpdated: new Date()
      }

      // Save to history (async, don't wait)
      this.saveToHistory(portfolioData).catch(err => 
        console.error('Error saving portfolio history:', err)
      )

      return portfolioData
    } catch (error) {
      console.error('Error fetching portfolio:', error)
      throw error
    }
  }

  async getPortfolioHistory(address: string, chainId: number, limit: number = 30): Promise<any[]> {
    try {
      const history = await PortfolioHistory
        .find({ 
          walletAddress: address.toLowerCase(), 
          chainId 
        })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean()

      return history
    } catch (error) {
      console.error('Error fetching portfolio history:', error)
      return []
    }
  }

  private async saveToHistory(portfolioData: PortfolioData): Promise<void> {
    try {
      await PortfolioHistory.create({
        walletAddress: portfolioData.walletAddress,
        chainId: portfolioData.chainId,
        timestamp: new Date(),
        totalValue: portfolioData.totalValue,
        tokens: portfolioData.tokens.map(t => ({
          symbol: t.symbol,
          balance: t.balance,
          usdValue: t.usdValue,
          percentage: t.percentage
        })),
        snapshot: false
      })
    } catch (error) {
      console.error('Error saving portfolio to history:', error)
    }
  }
}

export const portfolioService = new PortfolioService()
