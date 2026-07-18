import axios from 'axios';
import { createBillingApi } from '@/modules/billing/services/billingApi';
import { fetchCashSettingsAndSession } from '@/modules/billing/slices/cashSlice';
import { store } from '@/store/store';
import { db } from './db';
import { runPrecache } from './precache';
import { setLastSyncAt, setSyncing } from './slices/offlineSlice';

const SYNC_LOCK = 'diplebill-sync';
const SYNCED_RETENTION_DAYS = 7;
const BACKOFF_STEPS_MS = [5000, 15000, 30000, 60000];

let backoffIndex = 0;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

export const resetSyncBackoff = () => {
  backoffIndex = 0;
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
};

const scheduleRetry = () => {
  if (retryTimer) return;
  const delay = BACKOFF_STEPS_MS[Math.min(backoffIndex, BACKOFF_STEPS_MS.length - 1)];
  backoffIndex += 1;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    runSync();
  }, delay);
};

interface ISyncSummary {
  synced: number;
  errors: number;
}

// Sincroniza la cola FIFO de facturas offline. Web Locks serializa múltiples
// pestañas y el doble-mount de StrictMode; la idempotencia real la garantiza
// offline_reference en el backend.
export const runSync = async (): Promise<ISyncSummary | null> => {
  if (!('locks' in navigator)) {
    return runSyncInternal();
  }

  return navigator.locks.request(SYNC_LOCK, { ifAvailable: true }, async (lock) => {
    if (!lock) return null;
    return runSyncInternal();
  });
};

const runSyncInternal = async (): Promise<ISyncSummary> => {
  const summary: ISyncSummary = { synced: 0, errors: 0 };

  // Facturas que quedaron en 'syncing' por un cierre abrupto: reintentarlas.
  await db.offline_invoices.where('status').equals('syncing').modify({ status: 'pending' });

  const queue = await db.offline_invoices.where('status').equals('pending').sortBy('created_at');
  if (queue.length === 0) return summary;

  store.dispatch(setSyncing(true));

  try {
    for (const item of queue) {
      if (!store.getState().offlineSlice.isOnline) break;

      await db.offline_invoices.update(item.local_id, { status: 'syncing' });

      try {
        const response = await createBillingApi(item.payload as never);
        const serverInvoice = response?.data ?? response;

        await db.offline_invoices.update(item.local_id, {
          status: 'synced',
          synced_at: new Date().toISOString(),
          error_message: null,
          server_invoice_id: serverInvoice?.id ?? null,
          server_invoice_number: serverInvoice?.invoice_number ?? null
        });
        summary.synced += 1;
        resetSyncBackoff();
      } catch (error) {
        if (axios.isAxiosError(error) && !error.response) {
          // Error de red: revertir, abortar la pasada y reintentar con backoff.
          await db.offline_invoices.update(item.local_id, { status: 'pending' });
          scheduleRetry();
          break;
        }

        const message = axios.isAxiosError(error)
          ? (error.response?.data as { message?: string } | undefined)?.message ??
            `Error HTTP ${error.response?.status ?? 'desconocido'}`
          : 'Error inesperado al sincronizar';

        await db.offline_invoices.update(item.local_id, {
          status: 'error',
          attempts: item.attempts + 1,
          error_message: message
        });
        summary.errors += 1;
      }
    }
  } finally {
    store.dispatch(setSyncing(false));
  }

  if (summary.synced > 0) {
    const now = new Date().toISOString();
    store.dispatch(setLastSyncAt(now));

    // Refrescar la verdad del servidor: catálogo/stock y sesión de caja.
    const storeId =
      store.getState().storeSlice.store?.id || localStorage.getItem('currentStoreId') || '';
    if (storeId && store.getState().offlineSlice.isOnline) {
      runPrecache(storeId).catch(() => undefined);
      store.dispatch(fetchCashSettingsAndSession(storeId) as never);
    }
  }

  // Purga de sincronizadas antiguas.
  const cutoff = new Date(Date.now() - SYNCED_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await db.offline_invoices
    .where('status')
    .equals('synced')
    .filter((item) => (item.synced_at ?? '') < cutoff)
    .delete();

  return summary;
};
