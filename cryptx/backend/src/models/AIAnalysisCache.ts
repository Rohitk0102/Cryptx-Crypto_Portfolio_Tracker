import mongoose, { Schema, Document } from 'mongoose'

export interface IAIAnalysisCache extends Document {
  walletAddress: string
  analysisType: 'diversification' | 'forecast' | 'risk'
  input: any
  result: any
  confidence?: number
  createdAt: Date
}

const AIAnalysisCacheSchema = new Schema<IAIAnalysisCache>({
  walletAddress: {
    type: String,
    required: true,
    index: true,
    lowercase: true
  },
  analysisType: {
    type: String,
    enum: ['diversification', 'forecast', 'risk'],
    required: true
  },
  input: {
    type: Schema.Types.Mixed,
    required: true
  },
  result: {
    type: Schema.Types.Mixed,
    required: true
  },
  confidence: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // TTL: 24 hours
  }
})

// Compound index for efficient cache lookups
AIAnalysisCacheSchema.index({ walletAddress: 1, analysisType: 1 })

export const AIAnalysisCache = mongoose.model<IAIAnalysisCache>('AIAnalysisCache', AIAnalysisCacheSchema)
