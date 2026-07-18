import { db, metadataKeys, IOfflineInvoice } from './db';

interface IOfflineCounter {
  date: string; // YYMMDD
  seq: number;
}

const todayKey = () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
};

// Correlativo humano del ticket offline (OFF-YYMMDD-####). El identificador
// real de deduplicación es el uuid (offline_reference); este número es solo
// referencia visual. La transacción Dexie lo hace atómico entre pestañas.
export const nextOfflineNumber = async (storeId: string): Promise<string> => {
  const key = metadataKeys.offlineCounter(storeId);
  const date = todayKey();

  return db.transaction('rw', db.metadata, async () => {
    const entry = await db.metadata.get(key);
    const counter = (entry?.value as IOfflineCounter | undefined) ?? { date, seq: 0 };
    const seq = counter.date === date ? counter.seq + 1 : 1;
    await db.metadata.put({ key, value: { date, seq } });
    return `OFF-${date}-${String(seq).padStart(4, '0')}`;
  });
};

interface IQueueOfflineInvoiceArgs {
  localId: string;
  offlineNumber: string;
  storeId: string;
  payload: Record<string, unknown>;
  printSnapshot: Record<string, unknown>;
}

interface IPayloadProduct {
  product_id: string;
  inventory_id: string;
  quantity: number;
}

// Encola la venta y decrementa el stock local del catálogo cacheado en una
// sola transacción, para que las siguientes búsquedas offline reflejen la venta.
export const queueOfflineInvoice = async ({
  localId,
  offlineNumber,
  storeId,
  payload,
  printSnapshot
}: IQueueOfflineInvoiceArgs): Promise<void> => {
  const products = (payload.products as IPayloadProduct[] | undefined) ?? [];

  await db.transaction('rw', db.offline_invoices, db.products, async () => {
    const record: IOfflineInvoice = {
      local_id: localId,
      offline_number: offlineNumber,
      store_id: storeId,
      status: 'pending',
      error_message: null,
      attempts: 0,
      created_at: new Date().toISOString(),
      synced_at: null,
      server_invoice_id: null,
      server_invoice_number: null,
      payload,
      print_snapshot: printSnapshot
    };
    await db.offline_invoices.add(record);
    await adjustLocalStock(storeId, products, -1);
  });
};

const adjustLocalStock = async (
  storeId: string,
  products: IPayloadProduct[],
  direction: 1 | -1
) => {
  for (const item of products) {
    const cached = await db.products
      .where('store_id')
      .equals(storeId)
      .filter((p) => p.product_id === item.product_id && p.inventory_id === item.inventory_id)
      .first();

    if (cached) {
      await db.products.update(cached.id, {
        quantity: cached.quantity + direction * item.quantity
      });
    }
  }
};

export const retryErrored = async (localId: string): Promise<void> => {
  await db.offline_invoices.update(localId, { status: 'pending', error_message: null });
};

// Descartar una factura con error restituye el stock local que había descontado.
export const discardErrored = async (localId: string): Promise<void> => {
  await db.transaction('rw', db.offline_invoices, db.products, async () => {
    const record = await db.offline_invoices.get(localId);
    if (!record || record.status !== 'error') return;

    const products = (record.payload.products as IPayloadProduct[] | undefined) ?? [];
    await adjustLocalStock(record.store_id, products, 1);
    await db.offline_invoices.delete(localId);
  });
};

export const getUnsyncedCounts = async (): Promise<{ pending: number; errors: number }> => {
  const [pending, errors] = await Promise.all([
    db.offline_invoices.where('status').anyOf('pending', 'syncing').count(),
    db.offline_invoices.where('status').equals('error').count()
  ]);
  return { pending, errors };
};
