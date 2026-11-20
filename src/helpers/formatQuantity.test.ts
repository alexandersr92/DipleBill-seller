import { describe, expect, it } from 'vitest';
import { formatQuantity } from './formatQuantity';

describe('formatQuantity', () => {
  it('eliminates unnecessary trailing zeros from numeric strings', () => {
    expect(formatQuantity('1.00000')).toBe('1');
    expect(formatQuantity('1.50000')).toBe('1.5');
    expect(formatQuantity('2.25000')).toBe('2.25');
  });

  it('eliminates unnecessary trailing zeros from numbers', () => {
    expect(formatQuantity(1)).toBe('1');
    expect(formatQuantity(1.5)).toBe('1.5');
    expect(formatQuantity(2.25)).toBe('2.25');
  });

  it('handles zero representations as "0"', () => {
    expect(formatQuantity(0)).toBe('0');
    expect(formatQuantity('0')).toBe('0');
    expect(formatQuantity('0.00000')).toBe('0');
    expect(formatQuantity('-0')).toBe('0');
  });

  it('handles empty or missing values as "0"', () => {
    expect(formatQuantity(null)).toBe('0');
    expect(formatQuantity(undefined)).toBe('0');
    expect(formatQuantity('')).toBe('0');
    expect(formatQuantity('abc')).toBe('0');
  });

  it('handles comma decimal separators and trimmed whitespace', () => {
    expect(formatQuantity(' 1.50000 ')).toBe('1.5');
    expect(formatQuantity('2,25000')).toBe('2.25');
  });

  it('supports up to 5 decimal places and rounds beyond 5', () => {
    expect(formatQuantity('1.12345')).toBe('1.12345');
    expect(formatQuantity('1.12340')).toBe('1.1234');
    expect(formatQuantity(1.123456)).toBe('1.12346');
    expect(formatQuantity('0.00001')).toBe('0.00001');
    expect(formatQuantity('0.000004')).toBe('0');
  });
});
