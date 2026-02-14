import { PrismaClient } from '@prisma/client';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('P&L Tracking Schema Verification', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should have User model with costBasisMethod field', async () => {
    // This test verifies the schema is correctly set up
    // We're just checking that the Prisma client has the expected models
    expect(prisma.user).toBeDefined();
    expect(prisma.pnLTransaction).toBeDefined();
    expect(prisma.holding).toBeDefined();
    expect(prisma.realizedPnL).toBeDefined();
  });

  it('should have correct default value for costBasisMethod', async () => {
    // Create a test user to verify default value
    const testUser = await prisma.user.create({
      data: {
        mainAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
      },
    });

    expect(testUser.costBasisMethod).toBe('FIFO');

    // Cleanup
    await prisma.user.delete({
      where: { id: testUser.id },
    });
  });

  it('should create PnLTransaction with Decimal fields', async () => {
    // Create a test user first
    const testUser = await prisma.user.create({
      data: {
        mainAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
      },
    });

    // Create a PnL transaction
    const transaction = await prisma.pnLTransaction.create({
      data: {
        userId: testUser.id,
        walletAddress: '0x1234567890123456789012345678901234567890',
        chain: 'ethereum',
        tokenSymbol: 'ETH',
        txType: 'buy',
        quantity: '1.5',
        priceUsd: '2000.50',
        timestamp: new Date(),
        txHash: `0x${Math.random().toString(16).slice(2)}`,
        source: 'wallet',
      },
    });

    expect(transaction.quantity.toString()).toBe('1.5');
    expect(transaction.priceUsd.toString()).toBe('2000.5');

    // Cleanup
    await prisma.pnLTransaction.delete({
      where: { id: transaction.id },
    });
    await prisma.user.delete({
      where: { id: testUser.id },
    });
  });

  it('should enforce unique constraint on userId, txHash, walletAddress', async () => {
    const testUser = await prisma.user.create({
      data: {
        mainAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
      },
    });

    const txData = {
      userId: testUser.id,
      walletAddress: '0x1234567890123456789012345678901234567890',
      chain: 'ethereum',
      tokenSymbol: 'ETH',
      txType: 'buy',
      quantity: '1.0',
      priceUsd: '2000.00',
      timestamp: new Date(),
      txHash: '0xuniquehash123',
      source: 'wallet',
    };

    // Create first transaction
    const tx1 = await prisma.pnLTransaction.create({ data: txData });

    // Try to create duplicate - should fail
    await expect(
      prisma.pnLTransaction.create({ data: txData })
    ).rejects.toThrow();

    // Cleanup
    await prisma.pnLTransaction.delete({ where: { id: tx1.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
  });

  it('should create Holding with correct precision', async () => {
    const testUser = await prisma.user.create({
      data: {
        mainAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
      },
    });

    const holding = await prisma.holding.create({
      data: {
        userId: testUser.id,
        walletAddress: '0x1234567890123456789012345678901234567890',
        tokenSymbol: 'ETH',
        quantity: '123.456789012345678901',
        costBasisUsd: '12345678.12345678',
        costBasisMethod: 'FIFO',
      },
    });

    // Verify precision is maintained
    expect(holding.quantity.toString()).toBe('123.456789012345678901');
    expect(holding.costBasisUsd.toString()).toBe('12345678.12345678');

    // Cleanup
    await prisma.holding.delete({ where: { id: holding.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
  });

  it('should create RealizedPnL with foreign key relationships', async () => {
    const testUser = await prisma.user.create({
      data: {
        mainAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
      },
    });

    const transaction = await prisma.pnLTransaction.create({
      data: {
        userId: testUser.id,
        walletAddress: '0x1234567890123456789012345678901234567890',
        chain: 'ethereum',
        tokenSymbol: 'ETH',
        txType: 'sell',
        quantity: '1.0',
        priceUsd: '2500.00',
        timestamp: new Date(),
        txHash: `0x${Math.random().toString(16).slice(2)}`,
        source: 'wallet',
      },
    });

    const realizedPnL = await prisma.realizedPnL.create({
      data: {
        userId: testUser.id,
        tokenSymbol: 'ETH',
        realizedAmountUsd: '500.00',
        transactionId: transaction.id,
      },
    });

    expect(realizedPnL.realizedAmountUsd.toString()).toBe('500');
    expect(realizedPnL.transactionId).toBe(transaction.id);

    // Cleanup
    await prisma.realizedPnL.delete({ where: { id: realizedPnL.id } });
    await prisma.pnLTransaction.delete({ where: { id: transaction.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
  });

  it('should cascade delete when user is deleted', async () => {
    const testUser = await prisma.user.create({
      data: {
        mainAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
      },
    });

    const transaction = await prisma.pnLTransaction.create({
      data: {
        userId: testUser.id,
        walletAddress: '0x1234567890123456789012345678901234567890',
        chain: 'ethereum',
        tokenSymbol: 'ETH',
        txType: 'buy',
        quantity: '1.0',
        priceUsd: '2000.00',
        timestamp: new Date(),
        txHash: `0x${Math.random().toString(16).slice(2)}`,
        source: 'wallet',
      },
    });

    const holding = await prisma.holding.create({
      data: {
        userId: testUser.id,
        walletAddress: '0x1234567890123456789012345678901234567890',
        tokenSymbol: 'ETH',
        quantity: '1.0',
        costBasisUsd: '2000.00',
        costBasisMethod: 'FIFO',
      },
    });

    // Delete user - should cascade to transactions and holdings
    await prisma.user.delete({ where: { id: testUser.id } });

    // Verify cascade delete worked
    const deletedTx = await prisma.pnLTransaction.findUnique({
      where: { id: transaction.id },
    });
    const deletedHolding = await prisma.holding.findUnique({
      where: { id: holding.id },
    });

    expect(deletedTx).toBeNull();
    expect(deletedHolding).toBeNull();
  });
});
