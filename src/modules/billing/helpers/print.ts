import { downloadInvoiceAsPDF, InvoiceData, handleInvoicePrintHtml } from '.';
import { getStoreLogoAsBase64 } from '../services/billingApi';
import { getMetadata, metadataKeys } from '@/modules/offline/db';
import { ISingleInvoice } from '@diplebill/core';

interface IInvoiceActions {
  settings: {
    store_id: string;
    print_logo: File | string | null;
    print_header: string | undefined;
    print_footer: string;
    address: string;
    phone: string;
    invoice_prefix: string;
    print_width: number;
    print_note: string;
    store_currency: string;
    ruc: string;
  };
  invoice: ISingleInvoice;
  action: 'print' | 'download';
}
export const invoiceActions = async ({ settings, invoice, action }: IInvoiceActions) => {
  const normalizedInvoiceType = String(invoice.invoice_type ?? '')
    .trim()
    .toLowerCase();
  const isProforma = normalizedInvoiceType === 'proforma' || invoice.method === 'PROFORMA' || invoice.invoice_status === 'proforma';
  const isCreditSale = normalizedInvoiceType === 'credit' || normalizedInvoiceType === 'credito';
  let paymentMethod = '';
  if (isProforma) {
    paymentMethod = 'Proforma';
  } else if (isCreditSale || invoice.method === 'CREDIT') {
    paymentMethod = 'Crédito';
  } else {
    if (invoice.method === 'CASH') {
      paymentMethod = 'Efectivo';
      if (invoice.payment_metadata?.paid_usd) {
        paymentMethod += ` ($${invoice.payment_metadata.paid_usd} USD)`;
      }
    } else if (invoice.method === 'TRANSFER' || invoice.method === 'BACS') {
      paymentMethod = `Transf. ${invoice.payment_metadata?.bank || ''}`;
    } else if (invoice.method === 'CARD') {
      paymentMethod = `Tarjeta ${invoice.payment_metadata?.card_brand || ''}`;
    } else if (invoice.method === 'MULTIPLE') {
      const parts = (invoice.payment_metadata?.payments || []).map((p: any) => {
        if (p.method === 'CASH') {
          let str = `Efectivo C$ ${(p.amount || 0).toFixed(2)}`;
          if (p.paid_usd > 0) str += ` ($${p.paid_usd})`;
          return str;
        }
        if (p.method === 'TRANSFER') {
          return `${p.bank || 'Transf'} C$ ${(p.amount || 0).toFixed(2)}`;
        }
        if (p.method === 'CARD') {
          return `${p.card_brand || 'Tarj'} C$ ${(p.amount || 0).toFixed(2)}`;
        }
        return `${p.method} C$ ${(p.amount || 0).toFixed(2)}`;
      });
      paymentMethod = `Múltiples (${parts.join(' + ')})`;
    } else {
      paymentMethod = invoice.method ?? 'Efectivo';
    }
  }

  const products = invoice.invoice_details.map((product) => {
    return {
      sku: product.sku ?? '--',
      description: product.product_name,
      quantity: product.quantity ?? 0,
      unitPrice: product.price ?? 0,
      total: product.total
    };
  });

  let companyImage = '';
  if (settings.print_logo) {
    const logo = settings.print_logo as unknown as string;
    if (typeof logo === 'string' && logo.startsWith('data:image/')) {
      companyImage = logo;
    } else {
      try {
        const fetched = await getStoreLogoAsBase64(settings.store_id);
        companyImage = typeof fetched === 'string' ? fetched : '';
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('No se pudo obtener el logo para imprimir/descargar la factura.', error);
        }
        companyImage = '';
      }

      // Sin red: usar el logo base64 precacheado por el modo offline.
      if (!companyImage) {
        try {
          const cachedLogo = await getMetadata<string>(metadataKeys.logo(settings.store_id));
          if (cachedLogo) companyImage = cachedLogo;
        } catch {
          // El caché offline es opcional: sin logo se imprime igual.
        }
      }
    }
  } else {
    companyImage = '';
  }

  const invoiceGenerate: InvoiceData = {
    companyImage: (companyImage as string) ?? '',
    companyName: settings.print_header ?? '',
    companyRuc: settings.ruc ?? '',
    companyAddress: settings.address ?? '',
    companyTel: settings.phone ?? '',
    invoiceNumber: invoice.invoice_number,
    invoiceDate: invoice.invoice_date ?? '',
    paymentMethod,
    paymentMethodRaw: invoice.method ?? undefined,
    paymentMetadata: invoice.payment_metadata,
    currencyType: settings.store_currency,
    invoiceType: invoice.invoice_type ?? 'Contado',
    clientName: invoice.client_name ?? '',
    clientCedulaRuc: invoice.client_cedula_ruc ?? (invoice as any).client?.cedula_ruc ?? undefined,
    sellerName: invoice.seller ?? '',
    items: products ?? [],
    totalItems: invoice.total_items ?? 0,
    subtotal: (invoice.grand_total ?? 0) + (invoice.discount ?? 0),
    discount: invoice.discount ?? 0,
    tax: invoice.tax ?? 0,
    total: invoice.grand_total ?? 0,
    printWidth: parseInt(settings.print_width.toString() ?? 80),
    printFooter: settings.print_footer ?? '',
    printNote: settings.print_note ?? '',
    isOffline: Boolean((invoice as any).__offline)
  };

  if (action === 'download') return downloadInvoiceAsPDF({ data: invoiceGenerate });
  if (action === 'print') {
    return handleInvoicePrintHtml({ data: invoiceGenerate });
  }
};
