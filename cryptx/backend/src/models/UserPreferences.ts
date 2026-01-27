import mongoose, { Schema, Document } from 'mongoose'

export interface IUserPreferences extends Document {
  walletAddress: string
  preferredChain: number
  theme: 'light' | 'dark'
  currency: string
  notifications: {
    priceAlerts: boolean
    portfolioUpdates: boolean
  }
  createdAt: Date
  updatedAt: Date
}

const UserPreferencesSchema = new Schema<IUserPreferences>({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true
  },
  preferredChain: {
    type: Number,
    default: 1 // Ethereum mainnet
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'dark'
  },
  currency: {
    type: String,
    default: 'USD'
  },
  notifications: {
    priceAlerts: {
      type: Boolean,
      default: false
    },
    portfolioUpdates: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
})

export const UserPreferences = mongoose.model<IUserPreferences>('UserPreferences', UserPreferencesSchema)
