/**
 * Property-Based Tests for Authentication Service
 * Feature: web3-portfolio-tracker
 * Properties: 1 (SIWE Signature Verification), 2 (Session Token Lifecycle), 35 (JWT Signature Validation)
 * Validates: Requirements 1.4, 1.6, 1.7, 1.8, 1.9, 1.10, 14.4
 */

import * as fc from 'fast-check';
import { Wallet } from 'ethers';
import { SiweMessage } from 'siwe';
import { AuthService } from '../../services/auth.service';
import prisma from '../../utils/prisma';
import redisClient from '../../utils/redis';

describe('Property 1: SIWE Signature Verification', () => {
  let authService: AuthService;

  beforeAll(async () => {
    authService = new AuthService();
    // Ensure Redis is connected
    await redisClient.connect();
  });

  afterAll(async () => {
    // Clean up
    await prisma.user.deleteMany({});
    await prisma.session.deleteMany({});
    await redisClient.disconnect();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await prisma.user.deleteMany({});
    await prisma.session.deleteMany({});
  });

  test('Property: Valid SIWE signatures should always authenticate successfully', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.domain(), // Use domain generator for valid domains
        async (domain) => {
          // Create a random wallet
          const wallet = Wallet.createRandom();
          const address = wallet.address;

          // Generate nonce
          const nonce = await authService.createNonce(address);

          // Create SIWE message with a simple statement
          const message = new SiweMessage({
            domain,
            address,
            statement: 'Sign in to test application',
            uri: 'https://example.com',
            version: '1',
            chainId: 1,
            nonce,
          });

          const messageString = message.prepareMessage();

          // Sign the message
          const signature = await wallet.signMessage(messageString);

          // Verify signature
          const userId = await authService.verifySiweSignature(messageString, signature);

          // Should return a valid user ID
          expect(userId).toBeDefined();
          expect(typeof userId).toBe('string');
          expect(userId.length).toBeGreaterThan(0);

          // User should be created in database
          const user = await prisma.user.findUnique({
            where: { id: userId },
          });

          expect(user).toBeDefined();
          expect(user?.mainAddress.toLowerCase()).toBe(address.toLowerCase());

          // Nonce should be deleted after use
          const storedNonce = await authService.getNonce(address);
          expect(storedNonce).toBeNull();
        }
      ),
      { numRuns: 25, timeout: 60000 }
    );
  }, 90000);

  test('Property: Invalid signatures should always fail authentication', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.domain(),
        async (domain) => {
          // Create two different wallets
          const wallet1 = Wallet.createRandom();
          const wallet2 = Wallet.createRandom();
          const address1 = wallet1.address;

          // Generate nonce for wallet1
          const nonce = await authService.createNonce(address1);

          // Create SIWE message for wallet1
          const message = new SiweMessage({
            domain,
            address: address1,
            statement: 'Sign in to test app',
            uri: 'https://example.com',
            version: '1',
            chainId: 1,
            nonce,
          });

          const messageString = message.prepareMessage();

          // Sign with wallet2 (wrong wallet)
          const invalidSignature = await wallet2.signMessage(messageString);

          // Verification should fail
          await expect(
            authService.verifySiweSignature(messageString, invalidSignature)
          ).rejects.toThrow();

          // Nonce should still exist (not consumed)
          const storedNonce = await authService.getNonce(address1);
          expect(storedNonce).toBe(nonce);

          // Clean up nonce
          await authService.deleteNonce(address1);
        }
      ),
      { numRuns: 20, timeout: 60000 }
    );
  }, 90000);

  test('Property: Reusing a nonce should fail', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.domain(),
        async (domain) => {
          const wallet = Wallet.createRandom();
          const address = wallet.address;

          // Generate nonce
          const nonce = await authService.createNonce(address);

          // Create and sign message
          const message = new SiweMessage({
            domain,
            address,
            statement: 'Sign in to test app',
            uri: 'https://example.com',
            version: '1',
            chainId: 1,
            nonce,
          });

          const messageString = message.prepareMessage();
          const signature = await wallet.signMessage(messageString);

          // First verification should succeed
          const userId = await authService.verifySiweSignature(messageString, signature);
          expect(userId).toBeDefined();

          // Second verification with same nonce should fail
          await expect(
            authService.verifySiweSignature(messageString, signature)
          ).rejects.toThrow();
        }
      ),
      { numRuns: 20, timeout: 60000 }
    );
  }, 90000);
});

describe('Property 2: Session Token Lifecycle', () => {
  let authService: AuthService;

  beforeAll(async () => {
    authService = new AuthService();
    // Redis is already connected from previous test suite
  });

  afterAll(async () => {
    await prisma.user.deleteMany({});
    await prisma.session.deleteMany({});
  });

  afterEach(async () => {
    await prisma.user.deleteMany({});
    await prisma.session.deleteMany({});
  });

  test('Property: Generated tokens should be valid and verifiable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.hexa(),
        async (addressHex) => {
          // Ensure we have a 40-character hex string for Ethereum address
          const paddedHex = addressHex.padEnd(40, '0').slice(0, 40);
          const walletAddress = `0x${paddedHex}`;

          // Create user
          const user = await prisma.user.create({
            data: {
              mainAddress: walletAddress.toLowerCase(),
              createdAt: new Date(),
            },
          });

          // Generate tokens
          const tokens = await authService.generateTokens(user.id, walletAddress);

          // Tokens should be defined
          expect(tokens.accessToken).toBeDefined();
          expect(tokens.refreshToken).toBeDefined();

          // Access token should be verifiable
          const accessPayload = authService.verifyAccessToken(tokens.accessToken);
          expect(accessPayload.userId).toBe(user.id);
          expect(accessPayload.walletAddress.toLowerCase()).toBe(walletAddress.toLowerCase());

          // Refresh token should be verifiable
          const refreshPayload = await authService.verifyRefreshToken(tokens.refreshToken);
          expect(refreshPayload.userId).toBe(user.id);
          expect(refreshPayload.walletAddress.toLowerCase()).toBe(walletAddress.toLowerCase());

          // Refresh token should be stored in database
          const storedToken = await prisma.session.findFirst({
            where: { refreshToken: tokens.refreshToken },
          });
          expect(storedToken).toBeDefined();
          
        }
      ),
      { numRuns: 100, timeout: 60000 }
    );
  }, 90000);

  test('Property: Refreshing tokens should generate new valid tokens', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.hexa(),
        async (addressHex) => {
          // Ensure we have a 40-character hex string for Ethereum address
          const paddedHex = addressHex.padEnd(40, '0').slice(0, 40);
          const walletAddress = `0x${paddedHex}`;

          // Create user
          const user = await prisma.user.create({
            data: {
              mainAddress: walletAddress.toLowerCase(),
              createdAt: new Date(),
            },
          });

          // Generate initial tokens
          const tokens1 = await authService.generateTokens(user.id, walletAddress);

          // Refresh tokens
          const tokens2 = await authService.refreshAccessToken(tokens1.refreshToken);

          // New tokens should be different
          expect(tokens2.accessToken).not.toBe(tokens1.accessToken);
          expect(tokens2.refreshToken).not.toBe(tokens1.refreshToken);

          // New tokens should be valid
          const accessPayload = authService.verifyAccessToken(tokens2.accessToken);
          expect(accessPayload.userId).toBe(user.id);

          const refreshPayload = await authService.verifyRefreshToken(tokens2.refreshToken);
          expect(refreshPayload.userId).toBe(user.id);

          // Old refresh token should be revoked
          await expect(
            authService.verifyRefreshToken(tokens1.refreshToken)
          ).rejects.toThrow();
        }
      ),
      { numRuns: 100, timeout: 60000 }
    );
  }, 90000);

  test('Property: Revoked tokens should not be verifiable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.hexa(),
        async (addressHex) => {
          // Ensure we have a 40-character hex string for Ethereum address
          const paddedHex = addressHex.padEnd(40, '0').slice(0, 40);
          const walletAddress = `0x${paddedHex}`;

          // Create user
          const user = await prisma.user.create({
            data: {
              mainAddress: walletAddress.toLowerCase(),
              createdAt: new Date(),
            },
          });

          // Generate tokens
          const tokens = await authService.generateTokens(user.id, walletAddress);

          // Revoke refresh token
          await authService.revokeRefreshToken(tokens.refreshToken);

          // Verification should fail
          await expect(
            authService.verifyRefreshToken(tokens.refreshToken)
          ).rejects.toThrow();
        }
      ),
      { numRuns: 100, timeout: 60000 }
    );
  }, 90000);
});

describe('Property 35: JWT Signature Validation', () => {
  let authService: AuthService;

  beforeAll(async () => {
    authService = new AuthService();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({});
    await prisma.session.deleteMany({});
  });

  afterEach(async () => {
    await prisma.user.deleteMany({});
    await prisma.session.deleteMany({});
  });

  test('Property: Tampered JWT tokens should fail verification', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.hexa(),
        async (addressHex) => {
          // Ensure we have a 40-character hex string for Ethereum address
          const paddedHex = addressHex.padEnd(40, '0').slice(0, 40);
          const walletAddress = `0x${paddedHex}`;

          // Create user
          const user = await prisma.user.create({
            data: {
              mainAddress: walletAddress.toLowerCase(),
              createdAt: new Date(),
            },
          });

          // Generate tokens
          const tokens = await authService.generateTokens(user.id, walletAddress);

          // Tamper with access token (change last character)
          const tamperedToken = tokens.accessToken.slice(0, -1) + 
            (tokens.accessToken.slice(-1) === 'A' ? 'B' : 'A');

          // Verification should fail
          expect(() => {
            authService.verifyAccessToken(tamperedToken);
          }).toThrow();
        }
      ),
      { numRuns: 100, timeout: 60000 }
    );
  }, 90000);

  test('Property: JWT tokens should contain correct payload data', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.hexa(),
        async (addressHex) => {
          // Ensure we have a 40-character hex string for Ethereum address
          const paddedHex = addressHex.padEnd(40, '0').slice(0, 40);
          const walletAddress = `0x${paddedHex}`;

          // Create user
          const user = await prisma.user.create({
            data: {
              mainAddress: walletAddress.toLowerCase(),
              createdAt: new Date(),
            },
          });

          // Generate tokens
          const tokens = await authService.generateTokens(user.id, walletAddress);

          // Verify payload
          const payload = authService.verifyAccessToken(tokens.accessToken);

          expect(payload.userId).toBe(user.id);
          expect(payload.walletAddress.toLowerCase()).toBe(walletAddress.toLowerCase());
          expect(payload.iat).toBeDefined();
          expect(payload.exp).toBeDefined();
          expect(payload.exp!).toBeGreaterThan(payload.iat!);
        }
      ),
      { numRuns: 100, timeout: 60000 }
    );
  }, 90000);
});
