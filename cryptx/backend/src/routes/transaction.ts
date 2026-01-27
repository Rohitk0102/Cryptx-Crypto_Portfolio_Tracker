import { Router } from 'express'
import { transactionController } from '../controllers/transaction'

const router = Router()

// GET /api/transactions/:address - Get transactions for address
router.get('/:address', transactionController.getTransactions.bind(transactionController))

// GET /api/transactions/hash/:hash - Get transaction by hash
router.get('/hash/:hash', transactionController.getTransactionByHash.bind(transactionController))

export default router
