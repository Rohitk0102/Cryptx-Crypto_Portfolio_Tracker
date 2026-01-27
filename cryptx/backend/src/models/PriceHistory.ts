import mongoose, { Schema, Document } from 'mongoose'

export interface IPriceHistory extends Document {
  tokenSymbol: string
  tokenAddress: string
  chainId: number
  timestamp: Date
  price: number
  volume24h?: number
  marketCap?: number
  priceChange24h?: number
}

const PriceHistorySchema = new Schema<IPriceHistory>({
  tokenSymbol: {
    type: String,
    required: true,
    index: true,
    uppercase: true
  },
  tokenAddress: {
    type: String,
    required: true,
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
  price: {
    type: Number,
    required: true
  },
  volume24h: {
    type: Number
  },
  marketCap: {
    type: Number
  },
  priceChange24h: {
    type: Number
  }
})

// Compound index for efficient price queries
PriceHistorySchema.index({ tokenSymbol: 1, timestamp: -1 })
PriceHistorySchema.index({ tokenAddress: 1, chainId: 1, timestamp: -1 })

export const PriceHistory = mongoose.model<IPriceHistory>('PriceHistory', PriceHistorySchema)
