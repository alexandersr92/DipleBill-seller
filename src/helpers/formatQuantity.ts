/**
 * Formats a quantity value (number or numeric string) into a clean string representation.
 * Trims unnecessary trailing decimal zeros up to a maximum of 5 decimal places.
 *
 * Examples:
 * - '1.00000' -> '1'
 * - '1.50000' -> '1.5'
 * - '2.25000' -> '2.25'
 */
export const formatQuantity = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') return '0';

  const normalized = typeof value === 'string' ? value.trim().replace(',', '.') : value;
  const num = typeof normalized === 'number' ? normalized : Number(normalized);

  if (isNaN(num) || num === 0) return '0';

  const fixed = num.toFixed(5);
  if (fixed === '0.00000' || fixed === '-0.00000') return '0';

  return fixed.replace(/(\.[0-9]*[1-9])0+$/, '$1').replace(/\.0+$/, '');
};
