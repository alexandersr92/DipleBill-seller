import { IInvoiceProduct } from '@diplebill/core';

export interface IInvoiceDraft {
  id: string;
  store_id: string;
  seller_id?: string;
  seller_name?: string;
  client_id: string | null;
  client_name: string;
  invoice_note?: string;
  sell_type: string;
  isCredit: boolean;
  payment_method?: string;
  invoice_expiration?: string;
  products: IInvoiceProduct[];
  total: number;
  discount: number;
  tax: number;
  grand_total: number;
  total_items: number;
  created_at: string;
  updated_at: string;
  reference_name?: string;
}
