import html2pdf from 'html2pdf.js';

import { currencyFormatter, currencyFormatterWithoutSym, calculateTotalDiscount, CurrencyFormat } from '@diplebill/core';
export { currencyFormatter, currencyFormatterWithoutSym, calculateTotalDiscount };
export type { CurrencyFormat };


export type IInvoiceStatus = 'paid' | 'cancelled' | 'pending' | 'canceled' | 'unknown';

type InvoiceStatus = {
  bgColor: string;
  textColor: string;
  circleColor: string;
  label: string;
};

interface HandleProps {
  event: React.KeyboardEvent;
  formRef: React.RefObject<HTMLFormElement>;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

const isHidden = (element: HTMLElement) =>
  element.offsetParent === null && getComputedStyle(element).position !== 'fixed';

const isFocusable = (element: HTMLElement) =>
  !element.hasAttribute('disabled') &&
  element.getAttribute('aria-hidden') !== 'true' &&
  !isHidden(element);

const getFocusableElements = (form: HTMLFormElement) =>
  Array.from(
    form.querySelectorAll<HTMLElement>(
      'input, select, textarea, button, [role="combobox"], [tabindex]:not([tabindex="-1"])'
    )
  ).filter(isFocusable);

const focusElement = (element?: HTMLElement | null) => {
  if (!element || !isFocusable(element)) return false;
  element.focus();
  return true;
};

const focusBySelector = (form: HTMLFormElement, selector?: string) => {
  if (!selector) return false;

  const target =
    form.querySelector<HTMLElement>(selector) ??
    document.querySelector<HTMLElement>(selector) ??
    document.getElementById(selector.replace(/^#/, ''));

  return focusElement(target);
};
export const formatInvoiceStatus = (status: IInvoiceStatus): InvoiceStatus => {
  const statusMap: { [key in IInvoiceStatus]: InvoiceStatus } = {
    paid: {
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      circleColor: 'fill-emerald-600',
      label: 'Pagado'
    },
    cancelled: {
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      circleColor: 'fill-red-600',
      label: 'Anulada'
    },
    canceled: {
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      circleColor: 'fill-red-600',
      label: 'Anulada'
    },
    pending: {
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      circleColor: 'fill-yellow-600',
      label: 'Pendiente'
    },
    unknown: {
      bgColor: 'bg-gray-50',
      textColor: 'text-gray-600',
      circleColor: 'fill-gray-600',
      label: 'Desconocido'
    }
  };
  return statusMap[status] || statusMap.unknown;
};

export const handleKeyDown = ({ event, formRef, buttonRef }: HandleProps) => {
  if (!formRef.current || !buttonRef.current) return;
  const target = event.target as HTMLElement | null;
  if (!target) return;

  const focusableElements = getFocusableElements(formRef.current);
  if (focusableElements.length === 0) return;
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  const isShift = event.shiftKey;

  if (event.key === 'Tab') {
    if (isShift && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!isShift && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  if (event.key === 'F4') {
    event.preventDefault();
    buttonRef.current.click();
    return;
  }

  if (event.key !== 'Enter') return;

  if (!isShift && target.closest('[data-enter-behavior="native"]')) return;

  if (target.tagName === 'TEXTAREA' && isShift) return;

  event.preventDefault();

  if (isShift) {
    buttonRef.current.click();
    return;
  }

  const nextSelector =
    target.getAttribute('data-enter-next') ??
    target.closest<HTMLElement>('[data-enter-next]')?.getAttribute('data-enter-next');

  if (focusBySelector(formRef.current, nextSelector ?? undefined)) return;

  const currentIndex = focusableElements.findIndex((element) => element === document.activeElement);
  const nextElement = focusableElements[currentIndex + 1] ?? firstElement;
  focusElement(nextElement);
};



export function generateInvoiceNumber(currentNumber: number) {
  const prefix = 'INV-';
  const nextNumber = currentNumber + 1;
  const paddedNumber = nextNumber.toString().padStart(6, '0');
  return `${prefix}${paddedNumber}`;
}



const formatDateAndHours = () => {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

const escapeHtml = (value: string = '') =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildInvoiceHtml = (data: InvoiceData) => {
  const subtotal = Number(data.subtotal ?? 0);
  const discount = Number(data.discount ?? 0);
  const tax = Number(data.tax ?? 0);
  const showSubtotal =
    subtotal > 0 && (discount > 0 || tax > 0 || Math.abs(subtotal - data.total) > 0.009);
  const discountPercentage =
    subtotal > 0 && discount > 0 ? Math.round((discount / subtotal) * 100) : null;
  const [currentPrintedDate, currentPrintedTime] = formatDateAndHours().split(' ');
  const normalizedInvoiceType = String(data.invoiceType ?? '').toLowerCase();
  const isProforma = normalizedInvoiceType === 'proforma' || data.paymentMethodRaw === 'PROFORMA';
  const saleLabel = isProforma
    ? 'PROFORMA / COTIZACIÓN'
    : (normalizedInvoiceType === 'cash' ? 'Venta Contado' : 'Venta Credito');
  const typography = {
    baseSize: '14px',
    smallSize: '14px',
    storeNameSize: '16px',
    sectionTitleSize: '14px',
    itemNameSize: '14px',
    itemMetaSize: '14px',
    totalsSize: '14px',
    grandTotalSize: '16px',
    bodyWeight: 500,
    mediumWeight: 600,
    strongWeight: 700,
    lineHeight: 1.25
  };

  const itemsRows = (data.items || [])
    .map(
      (item) => `
        <div class="item">
          <div class="item-name">${escapeHtml(item.description || '')}</div>
          <table class="item-meta-table">
            <tr>
              <td class="item-sku">${escapeHtml(item.sku || '--')} ${item.quantity}x</td>
              <td class="item-unit">${data.currencyType}${currencyFormatterWithoutSym(
                item.unitPrice.toString(),
                2
              )}</td>
              <td class="item-total">${data.currencyType}${currencyFormatterWithoutSym(
                item.total.toString(),
                2
              )}</td>
            </tr>
          </table>
        </div>`
    )
    .join('');

  let paymentDetailsHtml = '';
  if (isProforma) {
    paymentDetailsHtml = '';
  } else if (data.paymentMethodRaw === 'CASH' && data.paymentMetadata) {
    const paidNio = Number(data.paymentMetadata.paid_nio ?? data.paymentMetadata.paid_in_nio ?? 0);
    const paidUsd = Number(data.paymentMetadata.paid_usd ?? data.paymentMetadata.paid_in_usd ?? 0);
    const rate = Number(data.paymentMetadata.exchange_rate || 36.5);
    const changeNio = Number(data.paymentMetadata.change_nio || 0);

    let receivedStr = `${data.currencyType}${currencyFormatterWithoutSym(paidNio.toFixed(2), 2)}`;
    if (paidUsd > 0) {
      receivedStr += ` + $${paidUsd.toFixed(2)} USD`;
      if (rate > 0) {
        receivedStr += ` (Tasa ${rate})`;
      }
    }

    paymentDetailsHtml = `
      <tr class="summary-row" style="border-top: 1px dotted #000; font-weight: bold;">
        <td class="totals-label">Recibido:</td>
        <td class="totals-value">${receivedStr}</td>
      </tr>
      <tr class="summary-row">
        <td class="totals-label">Cambio:</td>
        <td class="totals-value">${data.currencyType}${currencyFormatterWithoutSym(changeNio.toFixed(2), 2)}</td>
      </tr>
    `;
  } else if (
    (data.paymentMethodRaw === 'TRANSFER' || data.paymentMethodRaw === 'BACS') &&
    data.paymentMetadata
  ) {
    const bank = data.paymentMetadata.bank || '';
    const ref = data.paymentMetadata.reference || '';
    paymentDetailsHtml = `
      <tr class="summary-row" style="border-top: 1px dotted #000; font-weight: bold;">
        <td class="totals-label">Banco:</td>
        <td class="totals-value">${escapeHtml(bank)}</td>
      </tr>
      ${
        ref
          ? `
      <tr class="summary-row">
        <td class="totals-label">Referencia:</td>
        <td class="totals-value">${escapeHtml(ref)}</td>
      </tr>
      `
          : ''
      }
    `;
  } else if (data.paymentMethodRaw === 'CARD' && data.paymentMetadata) {
    const brand = data.paymentMetadata.card_brand || 'Tarjeta';
    const lastFour = data.paymentMetadata.card_last_four || '';
    const ref = data.paymentMetadata.reference || '';
    paymentDetailsHtml = `
      <tr class="summary-row" style="border-top: 1px dotted #000; font-weight: bold;">
        <td class="totals-label">Tarjeta:</td>
        <td class="totals-value">${escapeHtml(brand)}${lastFour ? ` (*${lastFour})` : ''}</td>
      </tr>
      ${
        ref
          ? `
      <tr class="summary-row">
        <td class="totals-label">Referencia:</td>
        <td class="totals-value">${escapeHtml(ref)}</td>
      </tr>
      `
          : ''
      }
    `;
  } else if (
    data.paymentMethodRaw === 'MULTIPLE' &&
    data.paymentMetadata &&
    Array.isArray(data.paymentMetadata.payments)
  ) {
    let rowsHtml = `<tr class="summary-row" style="border-top: 1px dotted #000; font-weight: bold;"><td colspan="2" class="totals-label" style="text-align: left;">Desglose de Pago:</td></tr>`;
    data.paymentMetadata.payments.forEach((p: any) => {
      const amt = Number(p.amount || 0);
      if (p.method === 'CASH') {
        const pNio = Number(p.paid_nio || 0);
        const pUsd = Number(p.paid_usd || 0);
        const cNio = Number(p.change_nio || 0);
        let recStr = `${data.currencyType}${currencyFormatterWithoutSym(pNio.toFixed(2), 2)}`;
        if (pUsd > 0) recStr += ` + $${pUsd.toFixed(2)} USD`;
        rowsHtml += `
          <tr class="summary-row">
            <td class="totals-label" style="padding-left: 2mm;">Efectivo:</td>
            <td class="totals-value">${data.currencyType}${currencyFormatterWithoutSym(amt.toFixed(2), 2)}</td>
          </tr>
          <tr class="summary-row" style="font-size: 11px; opacity: 0.85;">
            <td class="totals-label" style="padding-left: 4mm;">Recibido:</td>
            <td class="totals-value">${recStr}</td>
          </tr>
          <tr class="summary-row" style="font-size: 11px; opacity: 0.85;">
            <td class="totals-label" style="padding-left: 4mm;">Cambio:</td>
            <td class="totals-value">${data.currencyType}${currencyFormatterWithoutSym(cNio.toFixed(2), 2)}</td>
          </tr>
        `;
      } else if (p.method === 'TRANSFER') {
        rowsHtml += `
          <tr class="summary-row">
            <td class="totals-label" style="padding-left: 2mm;">Transf. (${escapeHtml(p.bank || 'Banco')}):</td>
            <td class="totals-value">${data.currencyType}${currencyFormatterWithoutSym(amt.toFixed(2), 2)}</td>
          </tr>
          ${
            p.reference
              ? `
          <tr class="summary-row" style="font-size: 11px; opacity: 0.85;">
            <td class="totals-label" style="padding-left: 4mm;">Ref:</td>
            <td class="totals-value">${escapeHtml(p.reference)}</td>
          </tr>
          `
              : ''
          }
        `;
      } else if (p.method === 'CARD') {
        rowsHtml += `
          <tr class="summary-row">
            <td class="totals-label" style="padding-left: 2mm;">Tarj. (${escapeHtml(p.card_brand || 'Tarj')}${p.card_last_four ? ` *${p.card_last_four}` : ''}):</td>
            <td class="totals-value">${data.currencyType}${currencyFormatterWithoutSym(amt.toFixed(2), 2)}</td>
          </tr>
        `;
      }
    });
    paymentDetailsHtml = rowsHtml;
  }

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${data.invoiceNumber}</title>
      <style>
        /* Page size for print/PDF */
        @page { size: ${data.printWidth}mm auto; margin: 0; }

        .paper {
          width: ${data.printWidth}mm;
          margin: 0 auto;
          padding: 1.5mm 2.5mm 2.5mm;
          box-sizing: border-box;
          background: #fff !important;
          color: #000 !important;
          font-family: 'Arial', 'Helvetica Neue', 'Noto Sans', sans-serif;
          font-size: ${typography.baseSize};
          font-weight: ${typography.bodyWeight};
          line-height: ${typography.lineHeight};
          font-synthesis: none;
          font-feature-settings: 'tnum' 1;
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
          text-rendering: auto;
        }

        .paper * {
          box-sizing: border-box;
          color: #000 !important;
        }

        .paper .logo {
          margin-bottom: 1mm;
          text-align: center;
        }
        .paper .logo img {
          max-width: 100%;
          max-height: 18mm;
          object-fit: contain;
        }

        .paper .store-name {
          font-size: ${typography.storeNameSize};
          font-weight: ${typography.strongWeight};
          text-align: center;
          margin-bottom: 0.8mm;
          line-height: ${typography.lineHeight};
        }

        .paper .small {
          font-size: ${typography.smallSize};
          font-weight: ${typography.bodyWeight};
          text-align: center;
          margin-bottom: 0.6mm;
          line-height: ${typography.lineHeight};
        }

        .paper .hr {
          border-top: 1px dashed #000;
          margin: 2mm 0;
        }

        .paper table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .paper .meta-table td,
        .paper .totals-table td,
        .paper .item-meta-table td {
          padding: 0.7mm 0;
          vertical-align: top;
        }

        .paper .meta-label,
        .paper .totals-label {
          width: 45%;
          white-space: nowrap;
        }

        .paper .meta-label-wrap {
          white-space: normal;
          word-break: break-word;
        }

        .paper .meta-value,
        .paper .totals-value {
          text-align: right;
          word-break: break-word;
          font-weight: ${typography.mediumWeight};
        }

        .paper .section-title {
          font-size: ${typography.sectionTitleSize};
          font-weight: ${typography.mediumWeight};
          letter-spacing: 0.03em;
          margin-bottom: 1mm;
        }

        .paper .items {
          margin-top: 0.6mm;
        }

        .paper .item {
          padding: 1.6mm 0 2mm;
          page-break-inside: avoid;
        }

        .paper .item-name {
          font-size: ${typography.itemNameSize};
          font-weight: ${typography.mediumWeight};
          word-break: break-word;
          line-height: ${typography.lineHeight};
        }

        .paper .item-meta-table {
          margin-top: 0.4mm;
          font-size: ${typography.itemMetaSize};
        }

        .paper .item-sku {
          width: 42%;
          word-break: break-word;
          font-weight: ${typography.bodyWeight};
        }

        .paper .item-unit {
          width: 28%;
          text-align: right;
          white-space: nowrap;
          font-weight: ${typography.bodyWeight};
        }

        .paper .item-total {
          width: 30%;
          text-align: right;
          white-space: nowrap;
          font-weight: ${typography.strongWeight};
        }

        .paper .totals-table {
          margin-top: 0.4mm;
          font-size: ${typography.totalsSize};
        }

        .paper .summary-row td {
          padding: 0.5mm 0;
        }

        .paper .grand-total td {
          padding-top: 1.2mm;
          border-top: 1px dashed #000;
          font-size: ${typography.grandTotalSize};
          font-weight: ${typography.strongWeight};
        }

        .paper .note,
        .paper .footer {
          font-size: ${typography.smallSize};
          font-weight: ${typography.bodyWeight};
          text-align: center;
          margin-top: 2mm;
          line-height: ${typography.lineHeight};
        }

        .paper .footer {
          font-weight: ${typography.mediumWeight};
        }

        .paper .offline-banner {
          font-weight: ${typography.strongWeight};
          text-align: center;
          border: 1px dashed #000;
          padding: 1mm;
        }

        /* avoid ugly page splits */
        .paper tr,
        .paper .totals-table { page-break-inside: avoid; }
      </style>
    </head>
    <body>
      <div class="paper">
        <div class="receipt-header">
          ${data.companyImage ? `<div class="logo"><img src="${data.companyImage}" alt="logo" /></div>` : ''}
          <div class="store-name">${escapeHtml(data.companyName || '')}</div>
          <div class="small">${escapeHtml(data.companyAddress || '')}</div>
          <div class="small">${escapeHtml(data.companyTel || '')}</div>
        </div>

        <div class="hr"></div>

        <table class="meta-table">
          <tr>
            <td class="meta-label">${saleLabel} #${escapeHtml(data.invoiceNumber)}</td>
            <td class="meta-value"></td>
          </tr>
          ${
            data.isOffline
              ? `<tr>
            <td class="meta-label-wrap offline-banner" colspan="2">*** FACTURA OFFLINE - PENDIENTE DE SINCRONIZAR ***</td>
          </tr>`
              : ''
          }
          <tr>
            <td class="meta-label">Fecha: ${escapeHtml(data.invoiceDate || currentPrintedDate)}</td>
            <td class="meta-value">${escapeHtml(currentPrintedTime || '')}</td>
          </tr>
          <tr>
            <td class="meta-label-wrap" colspan="2">Moneda: ${escapeHtml(data.currencyType)}</td>
          </tr>
          <tr>
            <td class="meta-label-wrap" colspan="2">Cliente: ${escapeHtml(data.clientName)}</td>
          </tr>
          ${
            data.clientCedulaRuc
              ? `<tr>
            <td class="meta-label-wrap" colspan="2">Cédula/RUC: ${escapeHtml(data.clientCedulaRuc)}</td>
          </tr>`
              : ''
          }
          ${
            data.sellerName
              ? `<tr>
            <td class="meta-label-wrap" colspan="2">Vendedor: ${escapeHtml(data.sellerName)}</td>
          </tr>`
              : ''
          }
          ${
            data.paymentMethod
              ? `<tr>
            <td class="meta-label-wrap" colspan="2">Tipo de pago: ${escapeHtml(data.paymentMethod)}</td>
          </tr>`
              : ''
          }
        </table>

        <div class="hr"></div>

        <div class="items">${itemsRows}</div>

        <div class="hr"></div>

        <table class="totals-table">
          ${
            showSubtotal
              ? `<tr class="summary-row">
            <td class="totals-label">SUBTOTAL:</td>
            <td class="totals-value">${data.currencyType}${currencyFormatterWithoutSym(
              subtotal.toFixed(2),
              2
            )}</td>
          </tr>`
              : ''
          }
          ${
            discount > 0
              ? `<tr class="summary-row">
            <td class="totals-label">DESC${discountPercentage ? ` (${discountPercentage}%)` : ''}:</td>
            <td class="totals-value">-${data.currencyType}${currencyFormatterWithoutSym(
              discount.toFixed(2),
              2
            )}</td>
          </tr>`
              : ''
          }
          ${
            tax > 0
              ? `<tr class="summary-row">
            <td class="totals-label">IMPUESTO:</td>
            <td class="totals-value">${data.currencyType}${currencyFormatterWithoutSym(
              tax.toFixed(2),
              2
            )}</td>
          </tr>`
              : ''
          }
          <tr class="grand-total">
            <td class="totals-label">TOTAL:</td>
            <td class="totals-value">${data.currencyType}${currencyFormatterWithoutSym(
              data.total.toFixed(2),
              2
            )}</td>
          </tr>
          <tr class="summary-row">
            <td class="totals-label">Total articulos</td>
            <td class="totals-value">${data.totalItems}</td>
          </tr>
          ${paymentDetailsHtml}
        </table>

        ${data.printNote ? `<div class="note">${escapeHtml(data.printNote)}</div>` : ''}
        ${data.printFooter ? `<div class="footer">${escapeHtml(data.printFooter)}</div>` : ''}
        <div class="hr"></div>
      </div>
    </body>
  </html>`;
};

// ---------- 🖨 HTML Print ----------
export const handleInvoicePrintHtml = async ({ data }: { data: InvoiceData }) => {
  const html = buildInvoiceHtml(data);

  // Browser fallback: iframe + window.print()
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const cleanup = () => {
    try {
      document.body.removeChild(iframe);
    } catch {
      // ignore
    }
  };

  const safePrint = async () => {
    const win = iframe.contentWindow;
    const doc = win?.document;
    if (!win || !doc) return cleanup();

    const domReady = () =>
      new Promise<void>((resolve) => {
        if (doc.readyState === 'complete' || doc.readyState === 'interactive') return resolve();
        doc.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
      });

    const fontsReady = () =>
      'fonts' in doc ? (doc as any).fonts.ready.catch(() => {}) : Promise.resolve();

    const imagesReady = () =>
      Promise.all(
        Array.from(doc.images).map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((res) => {
                img.addEventListener('load', () => res(), { once: true });
                img.addEventListener('error', () => res(), { once: true });
              })
        )
      );

    await domReady();
    await fontsReady();
    await imagesReady();
    await new Promise((r) => setTimeout(r, 60));

    try {
      win.focus();
      win.print();
    } finally {
      win.addEventListener('afterprint', cleanup, { once: true });
      setTimeout(cleanup, 1000);
    }
  };

  if ('srcdoc' in iframe) {
    iframe.srcdoc = html;
    iframe.onload = () => safePrint();
  } else {
    const typedIframe = iframe as HTMLIFrameElement;
    typedIframe.onload = () => safePrint();
    const win = typedIframe.contentWindow;
    const doc = win?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
    }
  }
};

// ---------- 💾 Download PDF via html2pdf ----------
export const downloadInvoiceAsPDF = async ({ data }: { data: InvoiceData }) => {
  const html = buildInvoiceHtml(data);

  // mount hidden so images & webfonts can load, but no flicker
  const temp = document.createElement('div');
  temp.style.position = 'fixed';
  temp.style.left = '-10000px';
  temp.style.top = '0';
  temp.style.opacity = '0';
  temp.style.pointerEvents = 'none';
  temp.innerHTML = html;
  document.body.appendChild(temp);

  const el = temp.querySelector('.paper') as HTMLElement;
  const doc = temp.ownerDocument as Document;

  if (doc.readyState === 'loading') {
    await new Promise<void>((r) =>
      doc.addEventListener('DOMContentLoaded', () => r(), { once: true })
    );
  }

  if ('fonts' in doc) {
    try {
      await (doc as any).fonts.ready;
    } catch {
      console.error('Error waiting for fonts');
    }
  }

  const imgs = Array.from(doc.images);
  await Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((res) => {
            img.addEventListener('load', () => res(), { once: true });
            img.addEventListener('error', () => res(), { once: true });
          })
    )
  );

  // small layout settle
  await new Promise((r) => setTimeout(r, 50));

  const isProforma = String(data.invoiceType ?? '').toLowerCase() === 'proforma' || data.paymentMethodRaw === 'PROFORMA';
  const filename = isProforma ? `PROFORMA-${data.invoiceNumber}.pdf` : `${data.invoiceNumber}.pdf`;

  await html2pdf()
    .set({
      margin: 0,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#fff' },
      jsPDF: { unit: 'mm', format: [data.printWidth, 297], orientation: 'portrait' }
    })
    .from(el)
    .save();

  document.body.removeChild(temp);
};

interface InvoiceItem {
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceData {
  companyImage: string;
  companyName: string;
  companyRuc?: string;
  companyAddress: string;
  companyTel: string;
  invoiceType: 'Crédito' | 'Contado' | string;
  invoiceNumber: string;
  invoiceDate: string;
  paymentMethod?: string;
  paymentMethodRaw?: string;
  paymentMetadata?: any;
  currencyType: string;
  clientName: string;
  clientCedulaRuc?: string;
  sellerName?: string;
  items: InvoiceItem[];
  totalItems: number;
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  printWidth: number;
  printFooter: string;
  printNote: string;
  isOffline?: boolean;
}

export const getBase64FromURL = async (url: string): Promise<string | null> => {
  if (!url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};
