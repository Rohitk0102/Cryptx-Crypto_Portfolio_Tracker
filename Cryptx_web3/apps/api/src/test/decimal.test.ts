/**
 * Unit tests for decimal utility module
 * 
 * Tests safe arithmetic operations, banker's rounding, and precision maintenance
 */

import {
  toDecimal,
  add,
  subtract,
  multiply,
  divide,
  bankersRound,
  roundTokenQuantity,
  roundUsdValue,
  compare,
  isZero,
  isPositive,
  isNegative,
  min,
  max,
  abs,
  sum,
  toString,
  toNumber,
  Decimal,
  TOKEN_PRECISION,
  USD_PRECISION,
} from '../utils/decimal';

describe('Decimal Utility Module', () => {
  describe('toDecimal', () => {
    it('should convert number to Decimal', () => {
      const result = toDecimal(123.456);
      expect(result).toBeInstanceOf(Decimal);
      expect(result.toString()).toBe('123.456');
    });

    it('should convert string to Decimal', () => {
      const result = toDecimal('123.456');
      expect(result).toBeInstanceOf(Decimal);
      expect(result.toString()).toBe('123.456');
    });

    it('should return Decimal as-is', () => {
      const decimal = new Decimal('123.456');
      const result = toDecimal(decimal);
      expect(result).toBe(decimal);
    });

    it('should handle very large numbers without precision loss', () => {
      const largeNumber = '123456789012345678.123456789012345678';
      const result = toDecimal(largeNumber);
      expect(result.toString()).toBe(largeNumber);
    });
  });

  describe('add', () => {
    it('should add two numbers correctly', () => {
      const result = add(1.1, 2.2);
      expect(result.toString()).toBe('3.3');
    });

    it('should add strings correctly', () => {
      const result = add('1.1', '2.2');
      expect(result.toString()).toBe('3.3');
    });

    it('should add Decimals correctly', () => {
      const result = add(new Decimal('1.1'), new Decimal('2.2'));
      expect(result.toString()).toBe('3.3');
    });

    it('should handle very small numbers without precision loss', () => {
      const result = add('0.000000000000000001', '0.000000000000000002');
      expect(result.toString()).toBe('0.000000000000000003');
    });
  });

  describe('subtract', () => {
    it('should subtract two numbers correctly', () => {
      const result = subtract(5.5, 2.2);
      expect(result.toString()).toBe('3.3');
    });

    it('should handle negative results', () => {
      const result = subtract(2.2, 5.5);
      expect(result.toString()).toBe('-3.3');
    });

    it('should handle very small differences', () => {
      const result = subtract('1.000000000000000001', '1.000000000000000000');
      expect(result.toString()).toBe('0.000000000000000001');
    });
  });

  describe('multiply', () => {
    it('should multiply two numbers correctly', () => {
      const result = multiply(2.5, 4);
      expect(result.toString()).toBe('10');
    });

    it('should handle decimal multiplication without floating-point errors', () => {
      const result = multiply('0.1', '0.2');
      expect(result.toString()).toBe('0.02');
    });

    it('should handle large number multiplication', () => {
      const result = multiply('123456789.123456789', '987654321.987654321');
      expect(result.toString()).toBe('121932631356500531.347203169112635269');
    });
  });

  describe('divide', () => {
    it('should divide two numbers correctly', () => {
      const result = divide(10, 4);
      expect(result.toString()).toBe('2.5');
    });

    it('should throw error on division by zero', () => {
      expect(() => divide(10, 0)).toThrow('Division by zero');
    });

    it('should handle division with repeating decimals', () => {
      const result = divide(1, 3);
      // Should have high precision
      expect(result.toString()).toContain('0.333333333333333333333333333333333333333');
    });

    it('should apply banker\'s rounding by default', () => {
      // This is tested more thoroughly in bankersRound tests
      const result = divide(5, 2);
      expect(result.toString()).toBe('2.5');
    });
  });

  describe('bankersRound', () => {
    it('should round 2.5 to 2 (nearest even)', () => {
      const result = bankersRound(2.5, 0);
      expect(result.toString()).toBe('2');
    });

    it('should round 3.5 to 4 (nearest even)', () => {
      const result = bankersRound(3.5, 0);
      expect(result.toString()).toBe('4');
    });

    it('should round 4.5 to 4 (nearest even)', () => {
      const result = bankersRound(4.5, 0);
      expect(result.toString()).toBe('4');
    });

    it('should round 5.5 to 6 (nearest even)', () => {
      const result = bankersRound(5.5, 0);
      expect(result.toString()).toBe('6');
    });

    it('should round 2.4 to 2 (standard rounding)', () => {
      const result = bankersRound(2.4, 0);
      expect(result.toString()).toBe('2');
    });

    it('should round 2.6 to 3 (standard rounding)', () => {
      const result = bankersRound(2.6, 0);
      expect(result.toString()).toBe('3');
    });

    it('should round to specified decimal places', () => {
      const result = bankersRound(1.2345, 2);
      expect(result.toString()).toBe('1.23');
    });

    it('should handle negative numbers with banker\'s rounding', () => {
      const result1 = bankersRound(-2.5, 0);
      expect(result1.toString()).toBe('-2');
      
      const result2 = bankersRound(-3.5, 0);
      expect(result2.toString()).toBe('-4');
    });

    it('should round 2.25 to 2.2 with 1 decimal place (nearest even)', () => {
      const result = bankersRound(2.25, 1);
      expect(result.toString()).toBe('2.2');
    });

    it('should round 2.35 to 2.4 with 1 decimal place (nearest even)', () => {
      const result = bankersRound(2.35, 1);
      expect(result.toString()).toBe('2.4');
    });
  });

  describe('roundTokenQuantity', () => {
    it('should round to 18 decimal places', () => {
      const value = '1.123456789012345678901234567890';
      const result = roundTokenQuantity(value);
      expect(result.toString()).toBe('1.123456789012345679');
    });

    it('should preserve values with less than 18 decimal places', () => {
      const value = '1.123456789012345678';
      const result = roundTokenQuantity(value);
      expect(result.toString()).toBe('1.123456789012345678');
    });

    it('should apply banker\'s rounding at 18th decimal place', () => {
      // Value ending in exactly .5 at 19th decimal place
      const value = '1.1234567890123456785'; // 18th digit is 8, 19th is 5
      const result = roundTokenQuantity(value);
      expect(result.toString()).toBe('1.123456789012345678'); // Rounds to even (8)
    });
  });

  describe('roundUsdValue', () => {
    it('should round to 8 decimal places', () => {
      const value = '123.123456789012345';
      const result = roundUsdValue(value);
      expect(result.toString()).toBe('123.12345679');
    });

    it('should preserve values with less than 8 decimal places', () => {
      const value = '123.12345678';
      const result = roundUsdValue(value);
      expect(result.toString()).toBe('123.12345678');
    });

    it('should apply banker\'s rounding at 8th decimal place', () => {
      // Value ending in exactly .5 at 9th decimal place
      const value = '123.123456785'; // 8th digit is 8, 9th is 5
      const result = roundUsdValue(value);
      expect(result.toString()).toBe('123.12345678'); // Rounds to even (8)
    });
  });

  describe('compare', () => {
    it('should return -1 when first value is less', () => {
      expect(compare(1, 2)).toBe(-1);
    });

    it('should return 0 when values are equal', () => {
      expect(compare(2, 2)).toBe(0);
    });

    it('should return 1 when first value is greater', () => {
      expect(compare(3, 2)).toBe(1);
    });

    it('should handle very close values', () => {
      expect(compare('1.000000000000000001', '1.000000000000000002')).toBe(-1);
    });
  });

  describe('isZero', () => {
    it('should return true for zero', () => {
      expect(isZero(0)).toBe(true);
      expect(isZero('0')).toBe(true);
      expect(isZero(new Decimal(0))).toBe(true);
    });

    it('should return false for non-zero values', () => {
      expect(isZero(1)).toBe(false);
      expect(isZero(-1)).toBe(false);
      expect(isZero('0.000000000000000001')).toBe(false);
    });
  });

  describe('isPositive', () => {
    it('should return true for positive values', () => {
      expect(isPositive(1)).toBe(true);
      expect(isPositive('0.000000000000000001')).toBe(true);
    });

    it('should return false for zero and negative values', () => {
      expect(isPositive(0)).toBe(false);
      expect(isPositive(-1)).toBe(false);
    });
  });

  describe('isNegative', () => {
    it('should return true for negative values', () => {
      expect(isNegative(-1)).toBe(true);
      expect(isNegative('-0.000000000000000001')).toBe(true);
    });

    it('should return false for zero and positive values', () => {
      expect(isNegative(0)).toBe(false);
      expect(isNegative(1)).toBe(false);
    });
  });

  describe('min', () => {
    it('should return the smaller value', () => {
      const result = min(5, 3);
      expect(result.toString()).toBe('3');
    });

    it('should handle equal values', () => {
      const result = min(5, 5);
      expect(result.toString()).toBe('5');
    });

    it('should handle negative values', () => {
      const result = min(-5, -3);
      expect(result.toString()).toBe('-5');
    });
  });

  describe('max', () => {
    it('should return the larger value', () => {
      const result = max(5, 3);
      expect(result.toString()).toBe('5');
    });

    it('should handle equal values', () => {
      const result = max(5, 5);
      expect(result.toString()).toBe('5');
    });

    it('should handle negative values', () => {
      const result = max(-5, -3);
      expect(result.toString()).toBe('-3');
    });
  });

  describe('abs', () => {
    it('should return absolute value of positive number', () => {
      const result = abs(5);
      expect(result.toString()).toBe('5');
    });

    it('should return absolute value of negative number', () => {
      const result = abs(-5);
      expect(result.toString()).toBe('5');
    });

    it('should return zero for zero', () => {
      const result = abs(0);
      expect(result.toString()).toBe('0');
    });
  });

  describe('sum', () => {
    it('should sum an array of values', () => {
      const result = sum([1, 2, 3, 4, 5]);
      expect(result.toString()).toBe('15');
    });

    it('should handle empty array', () => {
      const result = sum([]);
      expect(result.toString()).toBe('0');
    });

    it('should handle mixed types', () => {
      const result = sum([1, '2', new Decimal(3)]);
      expect(result.toString()).toBe('6');
    });

    it('should handle decimal values without precision loss', () => {
      const result = sum(['0.1', '0.2', '0.3']);
      expect(result.toString()).toBe('0.6');
    });
  });

  describe('toString', () => {
    it('should convert Decimal to string', () => {
      const decimal = new Decimal('123.456');
      expect(toString(decimal)).toBe('123.456');
    });

    it('should format to specified decimal places', () => {
      const decimal = new Decimal('123.456789');
      expect(toString(decimal, 2)).toBe('123.46');
    });

    it('should handle very large numbers', () => {
      const decimal = new Decimal('123456789012345678.123456789012345678');
      expect(toString(decimal)).toBe('123456789012345678.123456789012345678');
    });
  });

  describe('toNumber', () => {
    it('should convert Decimal to number', () => {
      const decimal = new Decimal('123.456');
      expect(toNumber(decimal)).toBe(123.456);
    });

    it('should handle integer values', () => {
      const decimal = new Decimal('123');
      expect(toNumber(decimal)).toBe(123);
    });

    // Note: This test demonstrates precision loss warning
    it('should convert but may lose precision for very large numbers', () => {
      const decimal = new Decimal('123456789012345678.123456789012345678');
      const number = toNumber(decimal);
      // JavaScript numbers have limited precision
      expect(typeof number).toBe('number');
    });
  });

  describe('Precision constants', () => {
    it('should have correct TOKEN_PRECISION', () => {
      expect(TOKEN_PRECISION).toBe(18);
    });

    it('should have correct USD_PRECISION', () => {
      expect(USD_PRECISION).toBe(8);
    });
  });

  describe('Real-world financial calculations', () => {
    it('should calculate P&L correctly', () => {
      // Buy 1.5 ETH at $2000 each = $3000 cost
      const quantity = toDecimal('1.5');
      const buyPrice = toDecimal('2000');
      const sellPrice = toDecimal('2500');
      
      const costBasis = multiply(quantity, buyPrice);
      const proceeds = multiply(quantity, sellPrice);
      const pnl = subtract(proceeds, costBasis);
      
      expect(costBasis.toString()).toBe('3000');
      expect(proceeds.toString()).toBe('3750');
      expect(pnl.toString()).toBe('750');
    });

    it('should calculate weighted average cost correctly', () => {
      // Buy 1 ETH at $2000, 2 ETH at $2100, 1 ETH at $1900
      const purchases = [
        { quantity: toDecimal('1'), price: toDecimal('2000') },
        { quantity: toDecimal('2'), price: toDecimal('2100') },
        { quantity: toDecimal('1'), price: toDecimal('1900') },
      ];
      
      let totalCost = new Decimal(0);
      let totalQuantity = new Decimal(0);
      
      for (const purchase of purchases) {
        totalCost = add(totalCost, multiply(purchase.quantity, purchase.price));
        totalQuantity = add(totalQuantity, purchase.quantity);
      }
      
      const avgPrice = divide(totalCost, totalQuantity);
      
      expect(totalCost.toString()).toBe('8100');
      expect(totalQuantity.toString()).toBe('4');
      expect(avgPrice.toString()).toBe('2025');
    });

    it('should handle fee deductions correctly', () => {
      // Sell 1 ETH at $2500 with $10 fee
      const quantity = toDecimal('1');
      const price = toDecimal('2500');
      const fee = toDecimal('10');
      
      const grossProceeds = multiply(quantity, price);
      const netProceeds = subtract(grossProceeds, fee);
      
      expect(grossProceeds.toString()).toBe('2500');
      expect(netProceeds.toString()).toBe('2490');
    });

    it('should maintain precision with very small token amounts', () => {
      // 0.000000000000000001 tokens (1 wei in ETH terms)
      const smallAmount = toDecimal('0.000000000000000001');
      const price = toDecimal('2000');
      
      const value = multiply(smallAmount, price);
      
      expect(value.toString()).toBe('0.000000000000002');
    });
  });
});
