import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
    addWallet,
    getWallets,
    deleteWallet,
    getWalletBalances,
} from '../controllers/wallet.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/', addWallet);
router.get('/', getWallets);
router.delete('/:id', deleteWallet);
router.get('/:id/balances', getWalletBalances);

export default router;
