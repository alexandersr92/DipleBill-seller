// Compatibility contract until the shared core release in plan 16.
export type ProductUsage = 'sale' | 'supply' | 'both';

export const isSellable = (product: { product_usage?: ProductUsage }): boolean =>
  product.product_usage === 'sale' || product.product_usage === 'both';
