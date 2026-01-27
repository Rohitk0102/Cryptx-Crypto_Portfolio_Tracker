/**
 * Property-Based Tests for Wallet Data Persistence
 * Feature: web3-portfolio-tracker, Property 4: Wallet Data Persistence
 * Validates: Requirements 2.3
 */

import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Arbitraries for generating test data
const arbitraryEthAddress = fc.hexaString({ minLength: 40, maxLength: 40 })
  .map(hex => `0x${hex.toLowerCase()}`);

const arbitraryChain = fc.constantFrom('ethereum', 'polygon', 'bsc');

const arbitraryChainArray = fc.array(arbitraryChain, { minLength: 1, maxLength: 3 })
  .map(chains => Array.from(new Set(chains))); // Remove duplicates

const arbitraryProvider = fc.constantFrom('metamask', 'walletconnect');

const arbitraryNickname = fc.option(
  fc.string({ minLength: 1, maxLength: 50 }),
  { nil: undefined }
);

const arbitraryWalletData = fc.record({
  address: arbitraryEthAddress,
  provider: arbitraryProvider,
  chainTypes: arbitraryChainArray,
  nickname: arbitraryNickname,
});

describe('Property 4: Wallet Data Persistence', () => {
  let testUserId: string;

  beforeAll(async () => {
    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        mainAddress: '0x' + '1'.repeat(40),
      },
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.wallet.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Clean up wallets after each test
    await prisma.wallet.deleteMany({
      where: { userId: testUserId },
    });
  });

  test('Property: For any wallet with selected chains, storage should preserve all chain associations', async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryWalletData, async (walletData) => {
        let createdWalletId: string | null = null;
        
        try {
          // Create wallet
          const createdWallet = await prisma.wallet.create({
            data: {
              userId: testUserId,
              address: walletData.address,
              provider: walletData.provider,
              chainTypes: walletData.chainTypes,
              nickname: walletData.nickname,
            },
          });
          createdWalletId = createdWallet.id;

          // Retrieve wallet
          const retrievedWallet = await prisma.wallet.findUnique({
            where: { id: createdWallet.id },
          });

          // Assertions
          expect(retrievedWallet).not.toBeNull();
          expect(retrievedWallet!.address).toBe(walletData.address);
          expect(retrievedWallet!.provider).toBe(walletData.provider);
          expect(retrievedWallet!.nickname ?? undefined).toBe(walletData.nickname);
          
          // Chain associations should be preserved exactly
          expect(retrievedWallet!.chainTypes).toHaveLength(walletData.chainTypes.length);
          expect(retrievedWallet!.chainTypes.sort()).toEqual(walletData.chainTypes.sort());
        } finally {
          // Clean up this specific wallet
          if (createdWalletId) {
            await prisma.wallet.delete({
              where: { id: createdWalletId },
            }).catch(() => {}); // Ignore errors if already deleted
          }
        }
      }),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  }, 60000); // 60 second timeout for property test

  test('Property: Wallet retrieval should return exact same data as stored', async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryWalletData, async (walletData) => {
        let createdId: string | null = null;
        
        try {
          // Create wallet
          const created = await prisma.wallet.create({
            data: {
              userId: testUserId,
              address: walletData.address,
              provider: walletData.provider,
              chainTypes: walletData.chainTypes,
              nickname: walletData.nickname,
            },
          });
          createdId = created.id;

          // Retrieve by ID
          const retrievedById = await prisma.wallet.findUnique({
            where: { id: created.id },
          });

          // Retrieve by userId and address
          const retrievedByComposite = await prisma.wallet.findUnique({
            where: {
              userId_address: {
                userId: testUserId,
                address: walletData.address,
              },
            },
          });

          // Both retrieval methods should return the same data
          expect(retrievedById).toEqual(retrievedByComposite);
          expect(retrievedById!.address).toBe(walletData.address);
          expect(retrievedById!.provider).toBe(walletData.provider);
          expect(retrievedById!.chainTypes).toEqual(walletData.chainTypes);
          expect(retrievedById!.nickname ?? undefined).toBe(walletData.nickname);
        } finally {
          // Clean up
          if (createdId) {
            await prisma.wallet.delete({
              where: { id: createdId },
            }).catch(() => {});
          }
        }
      }),
      { numRuns: 100 }
    );
  }, 60000); // 60 second timeout for property test

  test('Property: Multiple wallets for same user should all be retrievable', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbitraryWalletData, { minLength: 1, maxLength: 5 }),
        async (walletsData) => {
          const createdIds: string[] = [];
          
          try {
            // Ensure unique addresses
            const uniqueWallets = walletsData.filter((wallet, index, self) =>
              index === self.findIndex((w) => w.address === wallet.address)
            );

            // Create all wallets
            const createdWallets = await Promise.all(
              uniqueWallets.map(walletData =>
                prisma.wallet.create({
                  data: {
                    userId: testUserId,
                    address: walletData.address,
                    provider: walletData.provider,
                    chainTypes: walletData.chainTypes,
                    nickname: walletData.nickname,
                  },
                })
              )
            );
            createdIds.push(...createdWallets.map(w => w.id));

            // Retrieve all wallets for user created in this test
            const retrievedWallets = await prisma.wallet.findMany({
              where: {
                userId: testUserId,
                id: { in: createdIds },
              },
            });

            // Should retrieve all created wallets
            expect(retrievedWallets).toHaveLength(createdWallets.length);

            // Each created wallet should be in retrieved wallets
            for (const created of createdWallets) {
              const found = retrievedWallets.find(w => w.id === created.id);
              expect(found).toBeDefined();
              expect(found!.address).toBe(created.address);
              expect(found!.chainTypes).toEqual(created.chainTypes);
            }
          } finally {
            // Clean up
            if (createdIds.length > 0) {
              await prisma.wallet.deleteMany({
                where: {
                  id: { in: createdIds },
                },
              }).catch(() => {});
            }
          }
        }
      ),
      { numRuns: 50 } // Fewer runs since we're creating multiple wallets
    );
  }, 60000); // 60 second timeout
});
