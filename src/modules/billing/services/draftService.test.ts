import 'fake-indexeddb/auto';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/modules/offline/db';
import { draftService, DRAFTS_UPDATED_EVENT } from './draftService';
import { IInvoiceProduct } from '@diplebill/core';

// Polyfill localStorage & window events for the node vitest environment
const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: storageMock,
    writable: true
  });
}

if (typeof globalThis.window === 'undefined') {
  const listeners: Record<string, ((event: Event) => void)[]> = {};
  Object.defineProperty(globalThis, 'window', {
    value: {
      addEventListener: (event: string, cb: (event: Event) => void) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(cb);
      },
      removeEventListener: (event: string, cb: (event: Event) => void) => {
        if (!listeners[event]) return;
        listeners[event] = listeners[event].filter((fn) => fn !== cb);
      },
      dispatchEvent: (event: Event) => {
        const cbs = listeners[event.type] || [];
        cbs.forEach((fn) => fn(event));
        return true;
      }
    },
    writable: true
  });
}

const sampleProducts: IInvoiceProduct[] = [
  {
    id: 'prod-1',
    product_id: 'prod-1',
    sku: 'SKU-001',
    barcode: '741001',
    name: 'Cuaderno Universitario',
    price: 50,
    quantity: 2,
    discount: 10,
    total: 100,
    tax: 0,
    grand_total: 90,
    inventory_id: 'inv-1',
    image: '',
    cost: 30,
    min_stock: 5,
    unit_of_measure: 'UND',
    categories: [],
    tags: [],
    inventory: []
  }
];

describe('draftService integration & contract', () => {
  beforeEach(async () => {
    localStorage.clear();
    await db.delete();
    await db.open();
  });

  afterEach(async () => {
    localStorage.clear();
    await db.delete();
  });

  it('guarda un borrador localmente sin afectar inventario ni caja', async () => {
    // 1. Simular producto en catálogo con stock
    await db.products.put({
      id: 'prod-1',
      product_id: 'prod-1',
      inventory_id: 'inv-1',
      inventory_name: 'Bodega Central',
      name: 'Cuaderno Universitario',
      quantity: 15,
      status: 'active',
      price: 50,
      barcode: '741001',
      sku: 'SKU-001',
      store_id: 'store-1',
      name_lower: 'cuaderno universitario',
      sku_lower: 'sku-001',
      barcode_lower: '741001'
    });

    const eventListener = vi.fn();
    window.addEventListener(DRAFTS_UPDATED_EVENT, eventListener);

    // 2. Guardar borrador
    const saved = draftService.saveDraft({
      store_id: 'store-1',
      seller_id: 'seller-1',
      seller_name: 'Cajero Test',
      client_id: 'cli-1',
      client_name: 'Juan Perez',
      invoice_note: 'Esperando confirmación',
      sell_type: 'contado',
      isCredit: false,
      products: sampleProducts,
      total: 100,
      discount: 10,
      tax: 0,
      grand_total: 90,
      total_items: 2,
      reference_name: 'Venta Juan'
    });

    expect(saved).toBeDefined();
    expect(saved.id).toBeDefined();
    expect(saved.reference_name).toBe('Venta Juan');
    expect(saved.grand_total).toBe(90);
    expect(eventListener).toHaveBeenCalled();

    // 3. Verificar que el inventario no se modificó
    const cachedProd = await db.products.get('prod-1');
    expect(cachedProd?.quantity).toBe(15); // NO descontó stock

    // 4. Verificar que no se encoló ninguna factura fiscal de caja
    const offlineInvoicesCount = await db.offline_invoices.count();
    expect(offlineInvoicesCount).toBe(0); // NO afectó caja

    window.removeEventListener(DRAFTS_UPDATED_EVENT, eventListener);
  });

  it('lista y filtra borradores por tienda respetando orden cronológico', () => {
    draftService.saveDraft({
      store_id: 'store-1',
      client_id: null,
      client_name: 'Borrador 1',
      sell_type: 'contado',
      isCredit: false,
      products: sampleProducts,
      total: 100,
      discount: 0,
      tax: 0,
      grand_total: 100,
      total_items: 2,
      reference_name: 'Ref 1'
    });

    draftService.saveDraft({
      store_id: 'store-2',
      client_id: null,
      client_name: 'Borrador Otra Tienda',
      sell_type: 'contado',
      isCredit: false,
      products: sampleProducts,
      total: 50,
      discount: 0,
      tax: 0,
      grand_total: 50,
      total_items: 1,
      reference_name: 'Ref Otra Tienda'
    });

    draftService.saveDraft({
      store_id: 'store-1',
      client_id: null,
      client_name: 'Borrador 2',
      sell_type: 'credito',
      isCredit: true,
      products: sampleProducts,
      total: 200,
      discount: 20,
      tax: 0,
      grand_total: 180,
      total_items: 4,
      reference_name: 'Ref 2'
    });

    const store1Drafts = draftService.getDrafts('store-1');
    expect(store1Drafts).toHaveLength(2);
    expect(store1Drafts[0].reference_name).toBe('Ref 2');
    expect(store1Drafts[1].reference_name).toBe('Ref 1');

    const store2Drafts = draftService.getDrafts('store-2');
    expect(store2Drafts).toHaveLength(1);
    expect(store2Drafts[0].reference_name).toBe('Ref Otra Tienda');
  });

  it('permite actualizar un borrador existente', () => {
    const initial = draftService.saveDraft({
      store_id: 'store-1',
      client_id: null,
      client_name: 'Cliente Original',
      sell_type: 'contado',
      isCredit: false,
      products: sampleProducts,
      total: 100,
      discount: 0,
      tax: 0,
      grand_total: 100,
      total_items: 2,
      reference_name: 'Mesa 1'
    });

    const updated = draftService.saveDraft({
      id: initial.id,
      created_at: initial.created_at,
      store_id: 'store-1',
      client_id: 'cli-99',
      client_name: 'Cliente Actualizado',
      sell_type: 'credito',
      isCredit: true,
      products: sampleProducts,
      total: 150,
      discount: 10,
      tax: 0,
      grand_total: 140,
      total_items: 3,
      reference_name: 'Mesa 1 - Modificado'
    });

    expect(updated.id).toBe(initial.id);
    expect(updated.client_name).toBe('Cliente Actualizado');
    expect(updated.reference_name).toBe('Mesa 1 - Modificado');

    const all = draftService.getDrafts('store-1');
    expect(all).toHaveLength(1);
    expect(all[0].reference_name).toBe('Mesa 1 - Modificado');
  });

  it('permite eliminar un borrador', () => {
    const saved = draftService.saveDraft({
      store_id: 'store-1',
      client_id: null,
      client_name: 'Por Eliminar',
      sell_type: 'contado',
      isCredit: false,
      products: sampleProducts,
      total: 100,
      discount: 0,
      tax: 0,
      grand_total: 100,
      total_items: 2
    });

    expect(draftService.getDrafts('store-1')).toHaveLength(1);

    draftService.deleteDraft(saved.id);

    expect(draftService.getDrafts('store-1')).toHaveLength(0);
    expect(draftService.getDraftById(saved.id)).toBeNull();
  });
});
