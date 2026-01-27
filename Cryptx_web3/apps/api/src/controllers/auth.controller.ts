import { Request, Response } from 'express';
import { SiweMessage } from 'siwe';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../utils/prisma';
import redis from '../utils/redis';

export const getNonce = async (req: Request, res: Response) => {
    try {
        const nonce = crypto.randomBytes(16).toString('hex');

        // Store nonce in Redis with 10 minute expiry
        await redis.setex(`nonce:${nonce}`, 600, 'valid');

        res.json({ nonce });
    } catch (error) {
        console.error('Error generating nonce:', error);
        res.status(500).json({ error: 'Failed to generate nonce' });
    }
};

export const verifySignature = async (req: Request, res: Response) => {
    try {
        const { message, signature } = req.body;

        if (!message || !signature) {
            return res.status(400).json({ error: 'Missing message or signature' });
        }

        // Parse SIWE message
        const siweMessage = new SiweMessage(message);

        // Verify nonce exists and is valid
        const nonceValid = await redis.get(`nonce:${siweMessage.nonce}`);
        if (!nonceValid) {
            return res.status(401).json({ error: 'Invalid or expired nonce' });
        }

        // Verify signature
        const fields = await siweMessage.verify({ signature });

        if (!fields.success) {
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Delete used nonce (prevent replay attacks)
        await redis.del(`nonce:${siweMessage.nonce}`);

        const address = siweMessage.address.toLowerCase();

        // Find or create user
        let user = await prisma.user.findUnique({
            where: { mainAddress: address },
        });

        if (!user) {
            user = await prisma.user.create({
                data: { mainAddress: address },
            });
        }

        // Generate tokens
        const accessToken = jwt.sign(
            { userId: user.id, address: user.mainAddress },
            process.env.JWT_SECRET as string,
            { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } as jwt.SignOptions
        );

        const refreshToken = jwt.sign(
            { userId: user.id },
            process.env.REFRESH_TOKEN_SECRET as string,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' } as jwt.SignOptions
        );

        // Store refresh token in database
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

        await prisma.session.create({
            data: {
                userId: user.id,
                refreshToken,
                deviceInfo: req.headers['user-agent'] || null,
                ipAddress: req.ip || null,
                expiresAt,
            },
        });

        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                address: user.mainAddress,
            },
        });
    } catch (error) {
        console.error('Error verifying signature:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        // Verify refresh token
        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET!
        ) as { userId: string };

        // Check if session exists
        const session = await prisma.session.findUnique({
            where: { refreshToken },
            include: { user: true },
        });

        if (!session || session.expiresAt < new Date()) {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        // Generate new access token
        const accessToken = jwt.sign(
            { userId: session.user.id, address: session.user.mainAddress },
            process.env.JWT_SECRET as string,
            { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } as jwt.SignOptions
        );

        res.json({ accessToken });
    } catch (error) {
        console.error('Error refreshing token:', error);
        res.status(401).json({ error: 'Invalid refresh token' });
    }
};

export const logout = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;

        if (refreshToken) {
            // Delete session from database
            await prisma.session.deleteMany({
                where: { refreshToken },
            });
        }

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Error logging out:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
};
