import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import { connectDatabase } from './utils/database'
import { connectRedis } from './utils/redis'
import portfolioRoutes from './routes/portfolio'
import transactionRoutes from './routes/transaction'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Connect to databases
connectDatabase()
connectRedis()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true
}
app.use(cors(corsOptions))

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.'
})
app.use('/api/', limiter)

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// API routes
app.use('/api/portfolio', portfolioRoutes)
app.use('/api/transactions', transactionRoutes)

// API info endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'Crypto Portfolio Tracker API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      portfolio: '/api/portfolio/:address',
      portfolioHistory: '/api/portfolio/:address/history',
      transactions: '/api/transactions/:address',
      ai: {
        diversification: '/api/ai/analyze-diversification',
        forecast: '/api/ai/forecast-prices',
        risk: '/api/ai/analyze-risk'
      }
    }
  })
})

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message)
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 Health check: http://localhost:${PORT}/health`)
})

export default app
