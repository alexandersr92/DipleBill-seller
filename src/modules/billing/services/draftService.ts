import { format } from 'date-fns';
import { IInvoiceProduct, ISingleInvoice } from '@diplebill/core';
import { db, IOfflineDraft } from '@/modules/offline/db';
import {
  cancelInvoiceById,
  createBillingApi,
  getInvoiceById,
  getInvoices,
  replaceInvoiceApi
} from './billingApi';
import type { IInvoiceDraft } from '../types/draft';

export interface ISaveDraftParams {
  draftId?: string | null;
  draftNumber?: string | null;
  storeId: string;
  sellerId: string;
  clientId: string | null;
  clientName: string;
  invoiceNote?: string;
  products: IInvoiceProduct[];
  isOnline: boolean;
}

export const generateDraftNumber = (): string => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BORR-${yy}${mm}${dd}-${rand}`;
};

export const draftToSingleInvoice = (draft: IOfflineDraft): ISingleInvoice => ({
  id: draft.id,
  invoice_number: draft.draft_number,
  invoice_date: draft.created_at.split('T')[0],
  invoice_status: 'draft',
  invoice_type: 'draft',
  client_id: draft.client_id,
  client_name: draft.client_name,
  invoice_note: draft.invoice_note,
  total_items: draft.total_items,
  discount: draft.discount,
  tax: 0,
  grand_total: draft.grand_total,
  method: 'DRAFT',
  client: {
    id: draft.client_id ?? undefined,
    name: draft.client_name,
    organization_id: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    zip: null,
    status: 'active',
    wholesaler: 0,
    notes: ''
  },
  invoice_details: (draft.products || []).map((p: any, idx: number) => ({
    id: p.temp_id || `detail-${idx}`,
    product_id: p.product_id,
    product_name: p.name,
    inventory_id: p.inventory_id ?? '',
    quantity: p.quantity,
    price: p.price,
    total: p.total,
    sku: p.sku,
    barcode: p.barcode,
    discount: p.discount,
    tax: p.tax,
    grand_total: p.grand_total,
    sort_order: idx
  }))
});

export const saveDraft = async ({
  draftId,
  draftNumber,
  storeId,
  sellerId,
  clientId,
  clientName,
  invoiceNote = '',
  products,
  isOnline
}: ISaveDraftParams): Promise<ISingleInvoice> => {
  const totalItems = products.reduce((sum, p) => sum + Math.abs(p.quantity || 0), 0);
  const total = products.reduce(
    (sum, p) => sum + (p.total || (p.price || 0) * (p.quantity || 0)),
    0
  );
  const discount = products.reduce((sum, p) => sum + (p.discount || 0), 0);
  const grandTotal = +(total - discount).toFixed(2);
  const cleanTotal = +total.toFixed(2);
  const cleanDiscount = +discount.toFixed(2);

  const cleanClientId = clientId === '--' || !clientId ? null : clientId;
  const cleanClientName = clientName || 'Cliente General';
  const finalDraftNumber = draftNumber || generateDraftNumber();

  if (!isOnline) {
    const id = draftId || crypto.randomUUID();
    const offlineDraft: IOfflineDraft = {
      id,
      draft_number: finalDraftNumber,
      store_id: storeId,
      client_id: cleanClientId,
      client_name: cleanClientName,
      invoice_note: invoiceNote,
      total_items: totalItems,
      total: cleanTotal,
      discount: cleanDiscount,
      grand_total: grandTotal,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      products: products.map((p) => ({ ...p }))
    };

    // Al guardar borrador NO se descuenta inventario ni se afecta caja
    await db.drafts.put(offlineDraft);
    return draftToSingleInvoice(offlineDraft);
  }

  const payload: any = {
    source: 'POS',
    store_id: storeId,
    client_id: cleanClientId,
    client_name: cleanClientName,
    invoice_number: finalDraftNumber,
    invoice_date: format(new Date(), 'yyyy-MM-dd'),
    invoice_note: invoiceNote,
    isCredit: false,
    is_draft: true,
    invoice_status: 'draft',
    payment_method: 'DRAFT',
    payment_metadata: {},
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    seller_id: sellerId,
    cash_session_id: null, // Sin afectar caja
    total: cleanTotal,
    discount: cleanDiscount,
    tax: 0,
    grand_total: grandTotal,
    products: products.map((product) => ({
      ...product,
      inventory_id: product.inventory_id ?? ''
    }))
  };

  if (draftId) {
    try {
      const response = await replaceInvoiceApi(draftId, payload);
      return response.invoice || response.data || { ...payload, id: draftId };
    } catch {
      // Si la API no soporta replace para draft, crear uno nuevo
      const response = await createBillingApi(payload);
      return response.data || { ...payload, id: draftId };
    }
  }

  const response = await createBillingApi(payload);
  return response.data || payload;
};

export const getDrafts = async (storeId: string, isOnline: boolean): Promise<ISingleInvoice[]> => {
  const offlineRecords = await db.drafts.where('store_id').equals(storeId).toArray();
  offlineRecords.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const mappedOffline = offlineRecords.map(draftToSingleInvoice);

  if (!isOnline) {
    return mappedOffline;
  }

  try {
    const response = await getInvoices({
      store_id: storeId,
      invoice_status: 'draft',
      per_page: 50,
      sort_by: 'created_at',
      order: 'desc'
    } as any);

    const onlineData = Array.isArray(response?.data) ? response.data : [];
    const onlineIds = new Set(onlineData.map((d: any) => d.id));
    const uniqueOffline = mappedOffline.filter((d) => !onlineIds.has(d.id));

    return [...uniqueOffline, ...onlineData];
  } catch (error) {
    if (import.meta.env.DEV) console.error('Error fetching online drafts:', error);
    return mappedOffline;
  }
};

export const getDraftById = async (id: string, isOnline: boolean): Promise<ISingleInvoice> => {
  const offline = await db.drafts.get(id);
  if (offline) {
    return draftToSingleInvoice(offline);
  }

  if (isOnline) {
    const response = await getInvoiceById(id);
    return response.data;
  }

  throw new Error('Borrador no encontrado en modo sin conexión.');
};

export const deleteDraft = async (id: string, isOnline: boolean): Promise<void> => {
  const offline = await db.drafts.get(id);
  if (offline) {
    await db.drafts.delete(id);
  }

  if (isOnline) {
    try {
      await cancelInvoiceById(id);
    } catch (e) {
      if (import.meta.env.DEV) console.warn('Could not delete draft on server:', e);
    }
  }
};

export const DRAFTS_UPDATED_EVENT = 'diplebill-drafts-updated';

export const draftService = {
  getDrafts: (storeId?: string): IInvoiceDraft[] => {
    try {
      const raw = localStorage.getItem('diplebill-drafts');
      const drafts = raw ? (JSON.parse(raw) as IInvoiceDraft[]) : [];
      const filtered = storeId ? drafts.filter((draft) => draft.store_id === storeId) : drafts;
      return filtered.sort(
        (a, b) =>
          new Date(b.updated_at || b.created_at).getTime() -
          new Date(a.updated_at || a.created_at).getTime()
      );
    } catch {
      return [];
    }
  },
  saveDraft: (
    draft: Omit<IInvoiceDraft, 'id' | 'created_at' | 'updated_at'> & {
      id?: string;
      created_at?: string;
      updated_at?: string;
    }
  ): IInvoiceDraft => {
    const drafts = draftService.getDrafts();
    const now = new Date().toISOString();
    const id =
      draft.id ||
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `draft-${Date.now()}`);

    const next: IInvoiceDraft = {
      ...draft,
      id,
      created_at: draft.created_at || now,
      updated_at: now
    };

    const filtered = drafts.filter((item) => item.id !== next.id);
    const updated = [next, ...filtered];

    try {
      localStorage.setItem('diplebill-drafts', JSON.stringify(updated));
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
    }

    try {
      db.drafts
        .put({
          id: next.id,
          draft_number: next.reference_name || `BORR-${next.id.slice(0, 8)}`,
          store_id: next.store_id,
          client_id: next.client_id,
          client_name: next.client_name,
          invoice_note: next.invoice_note || '',
          total_items: next.total_items,
          total: next.total,
          discount: next.discount,
          grand_total: next.grand_total,
          created_at: next.created_at,
          updated_at: next.updated_at,
          products: next.products
        })
        .catch(() => undefined);
    } catch {
      // Ignorar fallos de Dexie en entornos sin soporte
    }

    window.dispatchEvent(new Event(DRAFTS_UPDATED_EVENT));
    return next;
  },
  deleteDraft: (id: string) => {
    try {
      const filtered = draftService.getDrafts().filter((draft) => draft.id !== id);
      localStorage.setItem('diplebill-drafts', JSON.stringify(filtered));
    } catch (e) {
      if (import.meta.env.DEV) console.error(e);
    }

    try {
      db.drafts.delete(id).catch(() => undefined);
    } catch {
      // Ignorar fallos de Dexie en entornos sin soporte
    }

    window.dispatchEvent(new Event(DRAFTS_UPDATED_EVENT));
  },
  getDraftById: (id: string): IInvoiceDraft | null => {
    const draft = draftService.getDrafts().find((d) => d.id === id);
    return draft || null;
  }
};
