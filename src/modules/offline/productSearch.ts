import { IInvoiceProduct } from '@diplebill/core';
import { db, ICachedProduct } from './db';

const MAX_RESULTS = 50;

const toInvoiceProduct = (product: ICachedProduct): IInvoiceProduct =>
  product as unknown as IInvoiceProduct;

// Búsqueda por substring sobre el catálogo cacheado (name/sku/barcode).
// Los que empiezan con el término van primero.
export const searchProductsOffline = async (
  storeId: string,
  term: string
): Promise<IInvoiceProduct[]> => {
  const query = term.trim().toLowerCase();
  if (!query) return [];

  const products = await db.products.where('store_id').equals(storeId).toArray();

  const matches = products.filter(
    (p) =>
      p.name_lower.includes(query) || p.sku_lower.includes(query) || p.barcode_lower.includes(query)
  );

  matches.sort((a, b) => {
    const aStarts =
      a.name_lower.startsWith(query) || a.sku_lower.startsWith(query) ? 0 : 1;
    const bStarts =
      b.name_lower.startsWith(query) || b.sku_lower.startsWith(query) ? 0 : 1;
    if (aStarts !== bStarts) return aStarts - bStarts;
    return a.name_lower.localeCompare(b.name_lower);
  });

  return matches.slice(0, MAX_RESULTS).map(toInvoiceProduct);
};

export const findByBarcodeOffline = async (
  storeId: string,
  barcode: string
): Promise<IInvoiceProduct | null> => {
  const code = barcode.trim().toLowerCase();
  if (!code) return null;

  const match = await db.products.where('[store_id+barcode_lower]').equals([storeId, code]).first();

  if (match) return toInvoiceProduct(match);

  // Algunas lectoras entregan el SKU: intentar match exacto por SKU.
  const bySku = await db.products.where('[store_id+sku_lower]').equals([storeId, code]).first();
  return bySku ? toInvoiceProduct(bySku) : null;
};
