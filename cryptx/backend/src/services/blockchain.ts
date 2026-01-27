import { createPublicClient, http, formatUnits, Address } from 'viem'
import { mainnet, polygon, bsc } from 'viem/chains'
import axios from 'axios'

// ERC-20 ABI for balanceOf and decimals
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    type: 'function'
  }
] as const

interface TokenBalance {
  symbol: string
  name: string
  balance: string
  decimals: number
  usdValue: number
  percentage: number
  logo: string
  contractAddress: string
}

export class BlockchainService {
  private clients: Map<number, any>
  private alchemyKey: string

  constructor() {
    this.alchemyKey = process.env.ALCHEMY_API_KEY || ''
    this.clients = new Map()
    this.initializeClients()
  }

  private initializeClients() {
    // Ethereum
    this.clients.set(1, createPublicClient({
      chain: mainnet,
      transport: http(
        this.alchemyKey 
          ? `https://eth-mainnet.g.alchemy.com/v2/${this.alchemyKey}`
          : undefined
      )
    }))

    // Polygon
    this.clients.set(137, createPublicClient({
      chain: polygon,
      transport: http(
        this.alchemyKey
          ? `https://polygon-mainnet.g.alchemy.com/v2/${this.alchemyKey}`
          : undefined
      )
    }))

    // BSC
    this.clients.set(56, createPublicClient({
      chain: bsc,
      transport: http('https://bsc-dataseed.binance.org')
    }))
  }

  async getTokenBalances(address: string, chainId: number): Promise<TokenBalance[]> {
    try {
      const client = this.clients.get(chainId)
      if (!client) {
        throw new Error(`Unsupported chain ID: ${chainId}`)
      }

      // Get native token balance (ETH, MATIC, BNB)
      const nativeBalance = await client.getBalance({ address: address as Address })
      
      const nativeToken = this.getNativeTokenInfo(chainId)
      const nativeBalanceFormatted = formatUnits(nativeBalance, 18)

      const tokens: TokenBalance[] = [
        {
          symbol: nativeToken.symbol,
          name: nativeToken.name,
          balance: nativeBalanceFormatted,
          decimals: 18,
          usdValue: 0, // Will be filled by price service
          percentage: 0, // Will be calculated after getting all balances
          logo: nativeToken.logo,
          contractAddress: '0x0000000000000000000000000000000000000000'
        }
      ]

      // TODO: Get ERC-20 token balances
      // This would require either:
      // 1. Alchemy's token balance API
      // 2. A list of known token addresses
      // 3. Indexing service like The Graph

      return tokens
    } catch (error) {
      console.error(`Error fetching token balances for ${address} on chain ${chainId}:`, error)
      throw error
    }
  }

  private getNativeTokenInfo(chainId: number) {
    const tokens: Record<number, { symbol: string; name: string; logo: string }> = {
      1: { 
        symbol: 'ETH', 
        name: 'Ethereum',
        logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png'
      },
      137: { 
        symbol: 'MATIC', 
        name: 'Polygon',
        logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png'
      },
      56: { 
        symbol: 'BNB', 
        name: 'BNB',
        logo: 'https://cryptologos.cc/logos/bnb-bnb-logo.png'
      }
    }
    return tokens[chainId] || { symbol: 'UNKNOWN', name: 'Unknown', logo: '' }
  }

  async getTransactionCount(address: string, chainId: number): Promise<number> {
    try {
      const client = this.clients.get(chainId)
      if (!client) {
        throw new Error(`Unsupported chain ID: ${chainId}`)
      }

      const count = await client.getTransactionCount({ address: address as Address })
      return count
    } catch (error) {
      console.error(`Error fetching transaction count:`, error)
      return 0
    }
  }
}

export const blockchainService = new BlockchainService()
