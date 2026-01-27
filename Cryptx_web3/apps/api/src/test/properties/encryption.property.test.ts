/**
 * Property-Based Tests for Encryption Utility
 * Feature: web3-portfolio-tracker, Property 34: API Key Encryption
 * Validates: Requirements 14.2
 */

import * as fc from 'fast-check';
import { EncryptionService } from '../../utils/encryption';

describe('Property 34: API Key Encryption', () => {
  let encryptionService: EncryptionService;

  beforeAll(() => {
    encryptionService = new EncryptionService();
  });

  test('Property: For any API key, encrypting then decrypting should return the original value', async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        (apiKey) => {
          // Skip empty or whitespace-only strings for encryptApiKey
          fc.pre(apiKey.trim().length > 0);
          
          // Encrypt the API key
          const encrypted = encryptionService.encryptApiKey(apiKey);
          
          // Encrypted should be different from original
          expect(encrypted).not.toBe(apiKey);
          
          // Encrypted should be a valid base64 string
          expect(() => Buffer.from(encrypted, 'base64')).not.toThrow();
          
          // Decrypt the API key
          const decrypted = encryptionService.decryptApiKey(encrypted);
          
          // Decrypted should match original
          expect(decrypted).toBe(apiKey);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: Encrypting the same value twice should produce different ciphertexts', async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (apiKey) => {
          // Skip empty or whitespace-only strings
          fc.pre(apiKey.trim().length > 0);
          
          // Encrypt the same value twice
          const encrypted1 = encryptionService.encrypt(apiKey);
          const encrypted2 = encryptionService.encrypt(apiKey);
          
          // Ciphertexts should be different (due to random IV and salt)
          expect(encrypted1).not.toBe(encrypted2);
          
          // But both should decrypt to the same value
          const decrypted1 = encryptionService.decrypt(encrypted1);
          const decrypted2 = encryptionService.decrypt(encrypted2);
          
          expect(decrypted1).toBe(apiKey);
          expect(decrypted2).toBe(apiKey);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: Encrypted data should be tamper-evident', async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 100 }),
        (apiKey) => {
          // Skip strings that are too short or all whitespace
          fc.pre(apiKey.trim().length >= 5);
          
          // Encrypt the API key
          const encrypted = encryptionService.encrypt(apiKey);
          const buffer = Buffer.from(encrypted, 'base64');
          
          // Parse the encrypted data structure
          const encryptedData = JSON.parse(buffer.toString('utf8'));
          
          // Tamper with the actual encrypted content (flip bits)
          const encryptedHex = encryptedData.encrypted;
          const tamperedHex = encryptedHex.substring(0, encryptedHex.length - 2) + 
            (encryptedHex.substring(encryptedHex.length - 2) === 'ff' ? '00' : 'ff');
          
          encryptedData.encrypted = tamperedHex;
          
          // Re-encode the tampered data
          const tamperedEncrypted = Buffer.from(JSON.stringify(encryptedData)).toString('base64');
          
          // Decryption should fail for tampered data
          expect(() => {
            encryptionService.decrypt(tamperedEncrypted);
          }).toThrow();
        }
      ),
      { numRuns: 50 } // Fewer runs since we're testing error cases
    );
  });

  test('Property: Empty or whitespace-only API keys should be rejected', () => {
    const invalidKeys = ['', ' ', '  ', '\t', '\n', '   \t\n   '];
    
    for (const invalidKey of invalidKeys) {
      expect(() => {
        encryptionService.encryptApiKey(invalidKey);
      }).toThrow('API key cannot be empty');
    }
  });

  test('Property: Encryption rotation should preserve the original value', async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (apiKey) => {
          // Skip empty or whitespace-only strings
          fc.pre(apiKey.trim().length > 0);
          
          // Encrypt the API key
          const encrypted1 = encryptionService.encrypt(apiKey);
          
          // Rotate the encryption
          const encrypted2 = encryptionService.rotateEncryption(encrypted1);
          
          // Rotated encryption should be different
          expect(encrypted2).not.toBe(encrypted1);
          
          // But should decrypt to the same value
          const decrypted1 = encryptionService.decrypt(encrypted1);
          const decrypted2 = encryptionService.decrypt(encrypted2);
          
          expect(decrypted1).toBe(apiKey);
          expect(decrypted2).toBe(apiKey);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: isValidEncrypted should correctly identify valid encrypted strings', async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (apiKey) => {
          // Skip empty or whitespace-only strings
          fc.pre(apiKey.trim().length > 0);
          
          // Encrypt the API key
          const encrypted = encryptionService.encrypt(apiKey);
          
          // Should be identified as valid
          expect(encryptionService.isValidEncrypted(encrypted)).toBe(true);
          
          // Random string should not be valid
          const randomString = Buffer.from('random data').toString('base64');
          expect(encryptionService.isValidEncrypted(randomString)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: Generated API keys should be unique and of correct length', () => {
    const generatedKeys = new Set<string>();
    const keyLength = 32;
    const numKeys = 100;
    
    for (let i = 0; i < numKeys; i++) {
      const apiKey = encryptionService.generateApiKey(keyLength);
      
      // Should be hex string of correct length
      expect(apiKey).toMatch(/^[0-9a-f]+$/);
      expect(apiKey.length).toBe(keyLength * 2); // Hex encoding doubles length
      
      // Should be unique
      expect(generatedKeys.has(apiKey)).toBe(false);
      generatedKeys.add(apiKey);
    }
    
    // All keys should be unique
    expect(generatedKeys.size).toBe(numKeys);
  });

  test('Property: Hash function should be deterministic and one-way', async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        (value) => {
          // Skip empty or whitespace-only strings
          fc.pre(value.trim().length > 0);
          
          // Hash the value twice
          const hash1 = encryptionService.hash(value);
          const hash2 = encryptionService.hash(value);
          
          // Hashes should be identical (deterministic)
          expect(hash1).toBe(hash2);
          
          // Hash should be 64 characters (SHA-256 in hex)
          expect(hash1).toMatch(/^[0-9a-f]{64}$/);
          
          // Hash should be different from original (unless by extreme coincidence)
          if (value.length !== 64 || !/^[0-9a-f]{64}$/.test(value)) {
            expect(hash1).not.toBe(value);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: Different values should produce different hashes', async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 100 }),
        (value1, value2) => {
          // Skip if values are the same or whitespace-only
          fc.pre(value1 !== value2 && value1.trim().length > 0 && value2.trim().length > 0);
          
          const hash1 = encryptionService.hash(value1);
          const hash2 = encryptionService.hash(value2);
          
          // Different values should produce different hashes
          expect(hash1).not.toBe(hash2);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: Encryption should handle special characters and unicode', async () => {
    await fc.assert(
      fc.property(
        fc.unicodeString({ minLength: 1, maxLength: 100 }),
        (apiKey) => {
          // Skip empty or whitespace-only strings
          fc.pre(apiKey.trim().length > 0);
          
          // Encrypt the API key with unicode characters
          const encrypted = encryptionService.encrypt(apiKey);
          
          // Decrypt should return exact original
          const decrypted = encryptionService.decrypt(encrypted);
          
          expect(decrypted).toBe(apiKey);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property: Encryption should handle very long strings', async () => {
    await fc.assert(
      fc.property(
        fc.string({ minLength: 1000, maxLength: 5000 }),
        (longString) => {
          // Skip empty or whitespace-only strings
          fc.pre(longString.trim().length >= 1000);
          
          // Encrypt long string
          const encrypted = encryptionService.encrypt(longString);
          
          // Decrypt should return exact original
          const decrypted = encryptionService.decrypt(encrypted);
          
          expect(decrypted).toBe(longString);
          expect(decrypted.length).toBe(longString.length);
        }
      ),
      { numRuns: 20 } // Fewer runs for long strings
    );
  });
});
