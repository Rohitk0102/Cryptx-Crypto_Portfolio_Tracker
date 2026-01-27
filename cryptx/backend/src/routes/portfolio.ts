import { Router } from 'express'
import { portfolioController } from '../controllers/portfolio'

const router = Router()

// GET /api/portfolio/:address - Get current portfolio
router.get('/:address', portfolioController.getPortfolio.bind(portfolioController))

// GET /api/portfolio/:address/history - Get portfolio history
router.get('/:address/history', portfolioController.getPortfolioHistory.bind(portfolioController))

export default router
