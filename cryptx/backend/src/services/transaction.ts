import axios from 'axios'
import { cache } from '../utils/redis'

export interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  token: string
  timestamp: number
  status: 'success' | 'pending' | 'failed'
  gasUsed: string
  blockNumber: number
  tokenSymbol?: string
  tokenDecimals?: number
}

export class TransactionService {
  private alchemyKey: string
  private cacheTTL: number = 300 // 5 minutes

  constructor() {
    this.alchemyKey = process.env.ALCHEMY_API_KEY || ''
  }

  async getTransactions(
    address: string, 
    chainId: number, 
    page: number = 1, 
    pageSize: number = 20
  ): Promise<{ transactions: Transaction[]; total: number }> {
    try {
      // Check cache
      const cacheKey = `transactions:${address}:${chainId}:${page}:${pageSize}`
      const cached = await cache.get(cacheKey)
      
      if (cached) {
        return JSON.parse(cached)
      }

      // Fetch from Alchemy
      const transactions = await this.fetchFromAlchemy(address, chainId, page, pageSize)

      const result = {
        transactions,
        total: transactions.length
      }

      // Cache the result
      await cache.set(cacheKey, JSON.stringify(result), this.cacheTTL)

      return result
    } catch (error) {
      console.error('Error fetching transactions:', error)
      return { transactions: [], total: 0 }
    }
  }

  private async fetchFromAlchemy(
    address: string,
    chainId: number,
    page: number,
    pageSize: number
  ): Promise<Transaction[]> {
    try {
      if (!this.alchemyKey) {
        console.warn('Alchemy API key not configured')
        return []
      }

      const network = this.getAlchemyNetwork(chainId)
      if (!network) {
        throw new Error(`Unsupported chain ID: ${chainId}`)
      }

      const url = `https://${network}.g.alchemy.com/v2/${this.alchemyKey}`

      // Get asset transfers (includes ETH and ERC-20 transfers)
      const response = await axios.post(url, {
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getAssetTransfers',
        params: [
          {
            fromAddress: address,
            toAddress: address,
            category: ['external', 'erc20', 'erc721', 'erc1155'],
            maxCount: `0x${pageSize.toString(16)}`,
            order: 'desc',
            withMetadata: true
          }
        ]
      })

      const transfers = response.data.result?.transfers || []

      // Transform to our Transaction format
      const transactions: Transaction[] = transfers.map((transfer: any) => ({
        hash: transfer.hash,
        from: transfer.from,
        to: transfer.to || '',
        value: transfer.value?.toString() || '0',
        token: transfer.asset || 'ETH',
        timestamp: new Date(transfer.metadata?.blockTimestamp).getTime() / 1000,
        status: 'success' as const,
        gasUsed: '0',
        blockNumber: parseInt(transfer.blockNum, 16),
        tokenSymbol: transfer.asset,
        tokenDecimals: transfer.rawContract?.decimal || 18
      }))

      return transactions
    } catch (error) {
      console.error('Error fetching from Alchemy:', error)
      return []
    }
  }

  private getAlchemyNetwork(chainId: number): string | null {
    const networks: Record<number, string> = {
      1: 'eth-mainnet',
      137: 'polygon-mainnet',
      56: 'bnb-mainnet'
    }
    return networks[chainId] || null
  }

  async getTransactionByHash(hash: string, chainId: number): Promise<Transaction | null> {
    try {
      if (!this.alchemyKey) {
        return null
      }

      const network = this.getAlchemyNetwork(chainId)
      if (!network) {
        return null
      }

      const url = `https://${network}.g.alchemy.com/v2/${this.alchemyKey}`

      const response = await axios.post(url, {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionByHash',
        params: [hash]
      })

      const tx = response.data.result
      if (!tx) {
        return null
      }

      // Get transaction receipt for status
      const receiptResponse = await axios.post(url, {
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_getTransactionReceipt',
        params: [hash]
      })

      const receipt = receiptResponse.data.result

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to || '',
        value: parseInt(tx.value, 16).toString(),
        token: 'ETH',
        timestamp: Date.now() / 1000, // Would need block timestamp
        status: receipt?.status === '0x1' ? 'success' : 'failed',
        gasUsed: receipt?.gasUsed ? parseInt(receipt.gasUsed, 16).toString() : '0',
        blockNumber: parseInt(tx.blockNumber, 16)
      }
    } catch (error) {
      console.error('Error fetching transaction by hash:', error)
      return null
    }
  }
}

export const transactionService = new TransactionService()
