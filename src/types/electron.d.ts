import { InvoiceData } from '@/modules/billing/helpers';

export {};

declare global {
  interface Window {
    api?: {
      printInvoice: (data: InvoiceData) => Promise<{ success: boolean; message?: string }>;
      printSilent: (html: string) => Promise<{ success: boolean; message?: string }>;
    };
  }
}
