import Dexie, { Table } from 'dexie';

export interface LocalProduct {
  id: string;
  name: string;
  code: string | null;
  barcode: string | null;
  category_id?: string | null;
  tag_id?: string | null;
  price: number | string;
  currency?: string;
  quantity?: number; // Stock actual local
  raw_data: any; // El payload completo devuelto por la API
}

export interface LocalClient {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  document_type?: string | null;
  raw_data: any; // El payload completo devuelto por la API
  is_synced?: boolean; // false si fue creado localmente y no se ha sincronizado
}

export type SyncAction = 'CREATE_CLIENT' | 'CREATE_INVOICE' | 'CLOSE_CASH_SESSION';

export interface SyncQueueItem {
  id: string; // UUID local
  action: SyncAction;
  payload: any; // Datos de la acción a enviar al backend
  status: 'pending' | 'failed';
  error?: string;
  created_at: number; // timestamp
}

export class DipleBillDB extends Dexie {
  products!: Table<LocalProduct, string>;
  clients!: Table<LocalClient, string>;
  sync_queue!: Table<SyncQueueItem, string>;

  constructor() {
    super('DipleBillOfflineDB');

    this.version(1).stores({
      // Índices primarios y secundarios. Los que no están aquí no son indexados pero sí se guardan
      products: 'id, name, code, barcode',
      clients: 'id, name, document',
      sync_queue: 'id, action, status, created_at'
    });
  }
}

export const db = new DipleBillDB();
