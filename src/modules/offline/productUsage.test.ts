import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db, metadataKeys, setMetadata, type ICachedProduct } from './db';
import {
  searchProductsOffline,
  searchByBarcodeOffline,
  findByBarcodeOffline
} from './productSearch';
import { queueOfflineInvoice } from './offlineInvoice';

const product = (id: string, usage?: ICachedProduct['product_usage']): ICachedProduct => ({
  id,
  product_id: id,
  product_usage: usage,
  inventory_id: 'inventory',
  inventory_name: 'Inventario',
  name: 'Opalina',
  quantity: 0.5,
  status: 'active',
  price: 5,
  barcode: id,
  sku: id,
  store_id: 'store',
  name_lower: 'opalina',
  sku_lower: id,
  barcode_lower: id
});
const queue = (id: string) =>
  queueOfflineInvoice({
    localId: id,
    offlineNumber: 'OFF-1',
    storeId: 'store',
    printSnapshot: {},
    payload: { products: [{ product_id: id, inventory_id: 'inventory', quantity: 0.25 }] }
  });

beforeEach(async () => {
  await db.delete();
  await db.open();
});
afterAll(async () => {
  await db.delete();
});

describe('Catálogo vendible offline', () => {
  it('excluye insumos y entradas antiguas en texto, SKU y códigos exactos', async () => {
    await db.products.bulkPut([
      product('sale', 'sale'),
      product('both', 'both'),
      product('supply', 'supply'),
      product('legacy')
    ]);
    expect(await searchProductsOffline('store', 'opalina')).toHaveLength(2);
    expect(await findByBarcodeOffline('store', 'supply')).toBeNull();
    expect(await findByBarcodeOffline('store', 'legacy')).toBeNull();
    expect(await searchByBarcodeOffline('store', 'supply')).toEqual([]);
    expect((await findByBarcodeOffline('store', 'both'))?.product_id).toBe('both');
  });

  it('rechaza insumos sin encolar ni descontar stock y conserva fracciones vendibles', async () => {
    await db.products.bulkPut([product('supply', 'supply'), product('both', 'both')]);
    await expect(queue('supply')).rejects.toThrow('no está habilitado');
    expect(await db.offline_invoices.count()).toBe(0);
    expect((await db.products.get('supply'))?.quantity).toBe(0.5);
    await queue('both');
    expect(await db.offline_invoices.count()).toBe(1);
    expect((await db.products.get('both'))?.quantity).toBe(0.25);
  });

  it('actualiza v1 invalidando solo productos y preservando facturas pendientes y sesión', async () => {
    await db.delete();
    const old = new Dexie('diplebill-offline');
    old.version(1).stores({
      products: 'id, store_id, [store_id+sku_lower], [store_id+barcode_lower]',
      clients: 'id, name_lower',
      offline_invoices: 'local_id, status, created_at, [status+created_at], store_id',
      metadata: 'key'
    });
    await old.open();
    await old.table('products').put(product('legacy'));
    await old.table('offline_invoices').put({
      local_id: 'pending',
      status: 'pending',
      store_id: 'store',
      payload: { products: [] }
    });
    await old.table('metadata').put({ key: 'cash_snapshot_store', value: { isOpen: true } });
    old.close();
    await db.open();
    expect(await db.products.count()).toBe(0);
    expect((await db.offline_invoices.get('pending'))?.status).toBe('pending');
    expect((await db.metadata.get('cash_snapshot_store'))?.value).toEqual({ isOpen: true });
  });

  it('rechaza conceptos libres offline si la organización no tiene la opción habilitada', async () => {
    await expect(
      queueOfflineInvoice({
        localId: 'free-1',
        offlineNumber: 'OFF-1',
        storeId: 'store',
        printSnapshot: {},
        payload: {
          organization_id: 'org-test',
          products: [
            {
              item_type: 'free',
              description: 'Servicio offline',
              quantity: 1,
              price: 50
            }
          ]
        }
      })
    ).rejects.toThrow('no tiene habilitada la facturación de conceptos libres');
  });

  it('permite conceptos libres offline sin producto en catálogo ni alterar stock', async () => {
    await setMetadata(metadataKeys.allowFreeInvoiceItems('org-test'), true);
    await db.products.put(product('prod-1', 'sale'));

    await queueOfflineInvoice({
      localId: 'free-ok',
      offlineNumber: 'OFF-2',
      storeId: 'store',
      printSnapshot: {},
      payload: {
        organization_id: 'org-test',
        products: [
          {
            product_id: 'prod-1',
            inventory_id: 'inventory',
            quantity: 0.1
          },
          {
            item_type: 'free',
            description: 'Servicio Técnico',
            quantity: 1,
            price: 100
          }
        ]
      }
    });

    expect(await db.offline_invoices.count()).toBe(1);
    // Stock del producto registrado se descuenta
    expect((await db.products.get('prod-1'))?.quantity).toBe(0.4);
  });
});
