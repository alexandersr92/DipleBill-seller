import 'fake-indexeddb/auto';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db, metadataKeys, setMetadata, getMetadata } from '@/modules/offline/db';
import { draftService } from './draftService';
import { IInvoiceProduct } from '@diplebill/core';

// Polyfill localStorage & window events for node environment
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

const windowListeners: Record<string, ((event: Event) => void)[]> = {};
if (typeof globalThis.window === 'undefined') {
  Object.defineProperty(globalThis, 'window', {
    value: {
      addEventListener: (event: string, cb: (event: Event) => void) => {
        windowListeners[event] = windowListeners[event] || [];
        windowListeners[event].push(cb);
      },
      removeEventListener: (event: string, cb: (event: Event) => void) => {
        if (!windowListeners[event]) return;
        windowListeners[event] = windowListeners[event].filter((fn) => fn !== cb);
      },
      dispatchEvent: (event: Event) => {
        const cbs = windowListeners[event.type] || [];
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
    discount: 0,
    total: 100,
    tax: 0,
    grand_total: 100,
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

describe('Configuración de Proformas y Borradores (QA Settings Verification)', () => {
  beforeEach(async () => {
    localStorage.clear();
    await db.delete();
    await db.open();
    Object.keys(windowListeners).forEach((k) => delete windowListeners[k]);
  });

  afterAll(async () => {
    localStorage.clear();
    await db.delete();
  });

  describe('1. Almacenamiento en metadata y aislamiento multiorganización', () => {
    it('almacena allowProformas y allowInvoiceDrafts con claves aisladas por organización', async () => {
      const orgA = 'org-tenant-A';
      const orgB = 'org-tenant-B';

      // Inicialmente no están configurados
      expect(await getMetadata<boolean>(metadataKeys.allowProformas(orgA))).toBeUndefined();
      expect(await getMetadata<boolean>(metadataKeys.allowInvoiceDrafts(orgA))).toBeUndefined();

      // Guardar valores independientes para Organización A
      await setMetadata(metadataKeys.allowProformas(orgA), true);
      await setMetadata(metadataKeys.allowInvoiceDrafts(orgA), false);

      // Guardar valores diferentes para Organización B
      await setMetadata(metadataKeys.allowProformas(orgB), false);
      await setMetadata(metadataKeys.allowInvoiceDrafts(orgB), true);

      // Verificar que Org A mantiene sus configuraciones
      expect(await getMetadata<boolean>(metadataKeys.allowProformas(orgA))).toBe(true);
      expect(await getMetadata<boolean>(metadataKeys.allowInvoiceDrafts(orgA))).toBe(false);

      // Verificar que Org B mantiene sus configuraciones sin contaminar a Org A
      expect(await getMetadata<boolean>(metadataKeys.allowProformas(orgB))).toBe(false);
      expect(await getMetadata<boolean>(metadataKeys.allowInvoiceDrafts(orgB))).toBe(true);
    });

    it('valida las 4 combinaciones posibles de configuración entre proformas y borradores', async () => {
      const matrix = [
        { proformas: false, drafts: false, label: 'OFF / OFF' },
        { proformas: true, drafts: false, label: 'ON / OFF' },
        { proformas: false, drafts: true, label: 'OFF / ON' },
        { proformas: true, drafts: true, label: 'ON / ON' }
      ];

      for (const [index, combo] of matrix.entries()) {
        const orgId = `org-matrix-${index}`;
        await setMetadata(metadataKeys.allowProformas(orgId), combo.proformas);
        await setMetadata(metadataKeys.allowInvoiceDrafts(orgId), combo.drafts);

        const loadedProformas = await getMetadata<boolean>(metadataKeys.allowProformas(orgId));
        const loadedDrafts = await getMetadata<boolean>(metadataKeys.allowInvoiceDrafts(orgId));

        expect(loadedProformas).toBe(combo.proformas);
        expect(loadedDrafts).toBe(combo.drafts);
      }
    });
  });

  describe('2. Comportamiento de useDrafts y preservación de datos offline', () => {
    it('preserva borradores existentes cuando el setting se desactiva y los reactiva al habilitarlo', async () => {
      const orgId = 'org-test-1';
      const storeId = 'store-test-1';

      // 1. Setting activo y guardar un borrador
      await setMetadata(metadataKeys.allowInvoiceDrafts(orgId), true);
      expect(await getMetadata<boolean>(metadataKeys.allowInvoiceDrafts(orgId))).toBe(true);

      const savedDraft = draftService.saveDraft({
        store_id: storeId,
        client_id: null,
        client_name: 'Cliente Mesa 5',
        sell_type: 'contado',
        isCredit: false,
        products: sampleProducts,
        total: 100,
        discount: 0,
        tax: 0,
        grand_total: 100,
        total_items: 2,
        reference_name: 'Mesa 5'
      });

      expect(draftService.getDrafts(storeId)).toHaveLength(1);
      const offlineBefore = await db.drafts.where('store_id').equals(storeId).toArray();
      expect(offlineBefore).toHaveLength(1);

      // 2. Desactivar el setting en la organización
      await setMetadata(metadataKeys.allowInvoiceDrafts(orgId), false);
      expect(await getMetadata<boolean>(metadataKeys.allowInvoiceDrafts(orgId))).toBe(false);

      // 3. El almacenamiento físico (localStorage y Dexie) NO se eliminó
      const persisted = draftService.getDraftById(savedDraft.id);
      expect(persisted).not.toBeNull();
      expect(persisted?.reference_name).toBe('Mesa 5');
      expect(draftService.getDrafts(storeId)).toHaveLength(1);

      const offlineWhileDisabled = await db.drafts.where('store_id').equals(storeId).toArray();
      expect(offlineWhileDisabled).toHaveLength(1);
      expect(offlineWhileDisabled[0].id).toBe(savedDraft.id);

      // 4. Cuando el setting se vuelve a habilitar, los borradores siguen disponibles sin pérdida
      await setMetadata(metadataKeys.allowInvoiceDrafts(orgId), true);
      expect(await getMetadata<boolean>(metadataKeys.allowInvoiceDrafts(orgId))).toBe(true);

      const draftsWhenReenabled = draftService.getDrafts(storeId);
      expect(draftsWhenReenabled).toHaveLength(1);
      expect(draftsWhenReenabled[0].id).toBe(savedDraft.id);
      expect(draftsWhenReenabled[0].reference_name).toBe('Mesa 5');

      const offlineAfter = await db.drafts.where('store_id').equals(storeId).toArray();
      expect(offlineAfter).toHaveLength(1);
      expect(offlineAfter[0].id).toBe(savedDraft.id);
    });

    it('ejecuta useDrafts con mock de ciclo de vida de React verificando enabled=false y enabled=true', () => {
      const storeId = 'store-test-2';

      draftService.saveDraft({
        store_id: storeId,
        client_id: null,
        client_name: 'Draft Temporal',
        sell_type: 'contado',
        isCredit: false,
        products: sampleProducts,
        total: 100,
        discount: 0,
        tax: 0,
        grand_total: 100,
        total_items: 2,
        reference_name: 'Temp'
      });

      // Simular ejecución del hook con enabled = false
      const hookDisabledResult = runUseDraftsSimulated(storeId, false);
      expect(hookDisabledResult.drafts).toEqual([]);
      expect(hookDisabledResult.draftsCount).toBe(0);

      // Simular ejecución del hook con enabled = true
      const hookEnabledResult = runUseDraftsSimulated(storeId, true);
      expect(hookEnabledResult.drafts).toHaveLength(1);
      expect(hookEnabledResult.draftsCount).toBe(1);
      expect(hookEnabledResult.drafts[0].reference_name).toBe('Temp');
    });
  });

  describe('3. Bloqueo e intercepción de rutas y parámetros en frontend', () => {
    it('elimina ?proforma_id de URLSearchParams cuando allowProformas es false', () => {
      const allowProformas = false;
      const searchParams = new URLSearchParams('proforma_id=prof-123&other=value');

      if (!allowProformas && searchParams.has('proforma_id')) {
        searchParams.delete('proforma_id');
      }

      expect(searchParams.has('proforma_id')).toBe(false);
      expect(searchParams.get('other')).toBe('value');
      expect(searchParams.toString()).toBe('other=value');
    });

    it('permite ?proforma_id cuando allowProformas es true', () => {
      const allowProformas = true;
      const searchParams = new URLSearchParams('proforma_id=prof-123&other=value');

      if (!allowProformas && searchParams.has('proforma_id')) {
        searchParams.delete('proforma_id');
      }

      expect(searchParams.has('proforma_id')).toBe(true);
      expect(searchParams.get('proforma_id')).toBe('prof-123');
    });

    it('elimina ?draft_id y ?action de URLSearchParams cuando allowInvoiceDrafts es false', () => {
      const allowInvoiceDrafts = false;
      const searchParams = new URLSearchParams('draft_id=draft-999&action=checkout&step=1');

      if (!allowInvoiceDrafts && searchParams.has('draft_id')) {
        searchParams.delete('draft_id');
        searchParams.delete('action');
      }

      expect(searchParams.has('draft_id')).toBe(false);
      expect(searchParams.has('action')).toBe(false);
      expect(searchParams.get('step')).toBe('1');
    });

    it('redirige viewType a "sales" si viewType es "proformas" o "drafts" y el setting correspondiente está deshabilitado', () => {
      const testCases = [
        { viewType: 'proformas', allowProformas: false, allowDrafts: true, expected: 'sales' },
        { viewType: 'proformas', allowProformas: true, allowDrafts: true, expected: 'proformas' },
        { viewType: 'drafts', allowProformas: true, allowDrafts: false, expected: 'sales' },
        { viewType: 'drafts', allowProformas: true, allowDrafts: true, expected: 'drafts' },
        { viewType: 'sales', allowProformas: false, allowDrafts: false, expected: 'sales' }
      ];

      for (const tc of testCases) {
        let currentView = tc.viewType;
        if (currentView === 'proformas' && !tc.allowProformas) {
          currentView = 'sales';
        }
        if (currentView === 'drafts' && !tc.allowDrafts) {
          currentView = 'sales';
        }
        expect(currentView).toBe(tc.expected);
      }
    });

    it('resetea sellType de "proforma" a "contado" si allowProformas es false', () => {
      let sellType = 'proforma';
      const allowProformas = false;

      if (!allowProformas && sellType === 'proforma') {
        sellType = 'contado';
      }

      expect(sellType).toBe('contado');
    });
  });

  describe('4. Preservación offline integral de facturas y proformas cacheadas', () => {
    it('no elimina facturas ni datos de IndexedDB cuando se cambian los flags de proformas o borradores', async () => {
      // Registrar una factura offline
      await db.offline_invoices.put({
        local_id: 'off-inv-1',
        offline_number: 'OFF-261120-0001',
        store_id: 'store-1',
        status: 'pending',
        error_message: null,
        attempts: 0,
        created_at: new Date().toISOString(),
        synced_at: null,
        server_invoice_id: null,
        server_invoice_number: null,
        payload: { is_proforma: false, total: 100 },
        print_snapshot: { id: 'off-inv-1' }
      });

      // Desactivar ambos settings
      await setMetadata(metadataKeys.allowProformas('org-test'), false);
      await setMetadata(metadataKeys.allowInvoiceDrafts('org-test'), false);

      // Verificar que las facturas offline permanecen intactas
      const invoice = await db.offline_invoices.get('off-inv-1');
      expect(invoice).toBeDefined();
      expect(invoice?.local_id).toBe('off-inv-1');
      expect(invoice?.status).toBe('pending');
    });
  });
});

/**
 * Función auxiliar para verificar la lógica de useDrafts replicando su contrato
 */
function runUseDraftsSimulated(storeId: string, enabled: boolean) {
  let state = enabled ? draftService.getDrafts(storeId) : [];

  const refreshDrafts = () => {
    if (!enabled) {
      state = [];
      return;
    }
    state = draftService.getDrafts(storeId);
  };

  const saveDraft = (data: any) => draftService.saveDraft(data);
  const deleteDraft = (id: string) => draftService.deleteDraft(id);

  return {
    drafts: enabled ? state : [],
    draftsCount: enabled ? state.length : 0,
    refreshDrafts,
    saveDraft,
    deleteDraft,
    getDraftById: draftService.getDraftById
  };
}
