import { Request, Response } from 'express'
import { transactionService } from '../services/transaction'
import { z } from 'zod'

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
const chainIdSchema = z.number().int().positive()
const hashSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash')

export class TransactionController {
  async getTransactions(req: Request, res: Response) {
    try {
      const { address } = req.params
      const chainId = parseInt(req.query.chainId as string) || 1
      const page = parseInt(req.query.page as string) || 1
      const pageSize = parseInt(req.query.pageSize as string) || 20

      // Validate inputs
      addressSchema.parse(address)
      chainIdSchema.parse(chainId)

      // Limit page size
      const limitedPageSize = Math.min(pageSize, 100)

      const result = await transactionService.getTransactions(
        address,
        chainId,
        page,
        limitedPageSize
      )

      res.json({
        success: true,
        data: {
          transactions: result.transactions,
          pagination: {
            page,
            pageSize: limitedPageSize,
            total: result.total,
            hasMore: result.transactions.length === limitedPageSize
          }
        }
      })
    } catch (error) {
      console.error('Error in getTransactions:', error)
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input',
          details: error.errors
        })
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch transactions'
      })
    }
  }

  async getTransactionByHash(req: Request, res: Response) {
    try {
      const { hash } = req.params
      const chainId = parseInt(req.query.chainId as string) || 1

      // Validate inputs
      hashSchema.parse(hash)
      chainIdSchema.parse(chainId)

      const transaction = await transactionService.getTransactionByHash(hash, chainId)

      if (!transaction) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found'
        })
      }

      res.json({
        success: true,
        data: transaction
      })
    } catch (error) {
      console.error('Error in getTransactionByHash:', error)
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid input',
          details: error.errors
        })
      }

      res.status(500).json({
        success: false,
        error: 'Failed to fetch transaction'
      })
    }
  }
}

export const transactionController = new TransactionController()
