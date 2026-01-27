import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  user?: {
    address: string
    chainId?: number
  }
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  try {
    const secret = process.env.JWT_SECRET || 'your_jwt_secret_change_in_production'
    const decoded = jwt.verify(token, secret) as { address: string; chainId?: number }
    req.user = decoded
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

export function generateToken(address: string, chainId?: number): string {
  const secret = process.env.JWT_SECRET || 'your_jwt_secret_change_in_production'
  return jwt.sign({ address, chainId }, secret, { expiresIn: '24h' })
}

// Verify wallet signature (for future implementation)
export async function verifyWalletSignature(
  address: string,
  signature: string,
  message: string
): Promise<boolean> {
  // TODO: Implement wallet signature verification using ethers.js or viem
  // This will verify that the user actually owns the wallet address
  return true
}
