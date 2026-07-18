import Dexie, { Table } from 'dexie';
import { ISingleClient } from '@diplebill/core';

// Forma de InventoryInvoiceCollection (GET /v1/inventories/stores/{storeId})
// + store_id y campos *_lower precalculados para búsqueda offline.
export interface ICachedProduct {
  id: string;
  product_id: string;
  inventory_id: string;
  inventory_name: string;
  name: string;
  quantity: number;
  status: string;
  price: number | null;
  barcode: string | null;
  sku: string | null;
  store_id: string;
  name_lower: string;
  sku_lower: string;
  barcode_lower: string;
}

export interface ICachedClient extends ISingleClient {
  id: string;
  name_lower: string;
}

export type OfflineInvoiceStatus = 'pending' | 'syncing' | 'synced' | 'error';

export interface IOfflineInvoice {
  local_id: string; // crypto.randomUUID() — viaja como offline_reference
  offline_number: string; // OFF-YYMMDD-####, referencia humana del ticket
  store_id: string;
  status: OfflineInvoiceStatus;
  error_message: string | null;
  attempts: number;
  created_at: string; // ISO — orden FIFO de sincronización
  synced_at: string | null;
  server_invoice_id: string | null;
  server_invoice_number: string | null;
  payload: Record<string, unknown>; // body exacto para POST /v1/invoices
  print_snapshot: Record<string, unknown>; // ISingleInvoice local para reimprimir
}

export interface IMetadataEntry {
  key: string;
  value: unknown;
}

class OfflineDB extends Dexie {
  products!: Table<ICachedProduct, string>;
  clients!: Table<ICachedClient, string>;
  offline_invoices!: Table<IOfflineInvoice, string>;
  metadata!: Table<IMetadataEntry, string>;

  constructor() {
    super('diplebill-offline');
    this.version(1).stores({
      products: 'id, store_id, [store_id+sku_lower], [store_id+barcode_lower]',
      clients: 'id, name_lower',
      offline_invoices: 'local_id, status, created_at, [status+created_at], store_id',
      metadata: 'key'
    });
  }
}

export const db = new OfflineDB();

export const getMetadata = async <T>(key: string): Promise<T | undefined> => {
  const entry = await db.metadata.get(key);
  return entry?.value as T | undefined;
};

export const setMetadata = async (key: string, value: unknown): Promise<void> => {
  await db.metadata.put({ key, value });
};

export const metadataKeys = {
  authSnapshot: 'auth_snapshot',
  cashSnapshot: (storeId: string) => `cash_snapshot_${storeId}`,
  printSettings: (storeId: string) => `print_settings_${storeId}`,
  logo: (storeId: string) => `logo_${storeId}`,
  lastSync: (storeId: string) => `last_sync_${storeId}`,
  offlineCounter: (storeId: string) => `offline_counter_${storeId}`
};
