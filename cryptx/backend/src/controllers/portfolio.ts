import { Request, Response } from 'express'
import { portfolioService } from '../services/portfolio'
import { z } from 'zod'

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
const chainIdSchema = z.number().int().positive()

export class PortfolioController {
  async getPortfolio(req: Request, res: Response) {
    try {
      const { address } = req.params
      const chainId = parseInt(req.query.chainId as string) || 1

      // Validate inputs
      addressSchema.parse(address)
      chainIdSchema.parse(chainId)

      const portfolio = await portfolioService.getPortfolio(address, chainId)

      res.json({
        success: true,
        data: portfolio
      })
    } catch (error) {
      console.error('Error in getPortfolio:', error)
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input',
          details: error.errors
        })
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch portfolio'
      })
    }
  }

  async getPortfolioHistory(req: Request, res: Response) {
    try {
      const { address } = req.params
      const chainId = parseInt(req.query.chainId as string) || 1
      const limit = parseInt(req.query.limit as string) || 30

      // Validate inputs
      addressSchema.parse(address)
      chainIdSchema.parse(chainId)

      const history = await portfolioService.getPortfolioHistory(address, chainId, limit)

      res.json({
        success: true,
        data: history
      })
    } catch (error) {
      console.error('Error in getPortfolioHistory:', error)
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input',
          details: error.errors
        })
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch portfolio history'
      })
    }
  }
}

export const portfolioController = new PortfolioController()
