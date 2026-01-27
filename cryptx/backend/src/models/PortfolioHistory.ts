import mongoose, { Schema, Document } from 'mongoose'

interface TokenBalance {
  symbol: string
  balance: string
  usdValue: number
  percentage: number
}

export interface IPortfolioHistory extends Document {
  walletAddress: string
  chainId: number
  timestamp: Date
  totalValue: number
  tokens: TokenBalance[]
  snapshot: boolean
}

const PortfolioHistorySchema = new Schema<IPortfolioHistory>({
  walletAddress: {
    type: String,
    required: true,
    index: true,
    lowercase: true
  },
  chainId: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  totalValue: {
    type: Number,
    required: true
  },
  tokens: [{
    symbol: String,
    balance: String,
    usdValue: Number,
    percentage: Number
  }],
  snapshot: {
    type: Boolean,
    default: false
  }
})

// Compound index for efficient queries
PortfolioHistorySchema.index({ walletAddress: 1, timestamp: -1 })

export const PortfolioHistory = mongoose.model<IPortfolioHistory>('PortfolioHistory', PortfolioHistorySchema)
