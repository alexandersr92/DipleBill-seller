import { getBillingProductsApi, getStoreLogoAsBase64 } from '@/modules/billing/services/billingApi';
import { getClientsApi } from '@/modules/clients/services/clientsApi';
import { ISingleClient } from '@diplebill/core';
import { store } from '@/store/store';
import { getStoredToken } from '@/helpers/authSession';
import { db, metadataKeys, setMetadata, ICachedProduct } from './db';
import { mirrorClientsToCache } from './clientsCache';
import { setLastSyncAt } from './slices/offlineSlice';

interface IRawInventoryProduct {
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
}

const toCachedProduct = (raw: IRawInventoryProduct, storeId: string): ICachedProduct => ({
  ...raw,
  store_id: storeId,
  name_lower: (raw.name ?? '').toLowerCase(),
  sku_lower: (raw.sku ?? '').toLowerCase(),
  barcode_lower: (raw.barcode ?? '').toLowerCase()
});

// GET /v1/inventories/stores/{storeId} sin search devuelve el catálogo completo.
export const precacheCatalog = async (storeId: string) => {
  // No pisar el stock decrementado localmente mientras haya ventas sin sincronizar.
  const unsynced = await db.offline_invoices
    .where('status')
    .anyOf('pending', 'syncing')
    .count();
  if (unsynced > 0) return;

  const response = await getBillingProductsApi({ search: '', storeId });
  const rawProducts: IRawInventoryProduct[] = response?.data ?? [];
  const cached = rawProducts.filter((p) => p.id).map((p) => toCachedProduct(p, storeId));

  await db.transaction('rw', db.products, async () => {
    await db.products.where('store_id').equals(storeId).delete();
    await db.products.bulkPut(cached);
  });
};

export const precacheClients = async () => {
  const response = await getClientsApi({ per_page: 2000 });
  const clients: ISingleClient[] = response?.data ?? [];
  mirrorClientsToCache(clients);
};

export const precachePrintAssets = async (storeId: string) => {
  const logo = await getStoreLogoAsBase64(storeId);
  if (logo) {
    await setMetadata(metadataKeys.logo(storeId), logo);
  }

  const printInfo = store.getState().storeSlice.store;
  if (printInfo) {
    await setMetadata(metadataKeys.printSettings(storeId), {
      store_id: printInfo.id,
      print_logo: printInfo.print_logo ?? '',
      print_header: printInfo.print_header ?? '',
      print_footer: printInfo.print_footer ?? '',
      address: printInfo.address ?? '',
      phone: printInfo.phone ?? '',
      invoice_prefix: printInfo.invoice_prefix ?? '',
      print_width: printInfo.print_width ?? '80',
      print_note: printInfo.print_note ?? '',
      store_currency: printInfo.store_currency ?? '',
      ruc: printInfo.ruc ?? ''
    });
  }
};

// Snapshot de sesión para poder arrancar la app sin conexión (gates offline).
export const precacheAuthSnapshot = async () => {
  const token = getStoredToken();
  if (!token) return;

  const state = store.getState();
  await setMetadata(metadataKeys.authSnapshot, {
    token,
    user: state.userSlice,
    stores: state.storeSlice.stores,
    currentStore: state.storeSlice.store,
    cachedAt: new Date().toISOString()
  });
};

export const runPrecache = async (storeId: string) => {
  const results = await Promise.allSettled([
    precacheCatalog(storeId),
    precacheClients(),
    precachePrintAssets(storeId),
    precacheAuthSnapshot()
  ]);

  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length > 0 && import.meta.env.DEV) {
    console.warn('Precache offline incompleto:', failed);
  }

  if (failed.length < results.length) {
    const now = new Date().toISOString();
    await setMetadata(metadataKeys.lastSync(storeId), now);
    store.dispatch(setLastSyncAt(now));
  }
};
