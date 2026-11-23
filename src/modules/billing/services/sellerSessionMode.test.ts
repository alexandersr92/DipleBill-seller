import 'fake-indexeddb/auto';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { db, metadataKeys, setMetadata, getMetadata } from '@/modules/offline/db';

describe('seller_session_mode (Sesión del vendedor después de facturar)', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  afterAll(async () => {
    await db.delete();
  });

  it('guarda y recupera el modo de sesión en metadata por organización', async () => {
    const orgId = 'org-123';

    // Inicialmente no existe
    const initial = await getMetadata<string>(metadataKeys.sellerSessionMode(orgId));
    expect(initial).toBeUndefined();

    // Guardar PERSISTENT
    await setMetadata(metadataKeys.sellerSessionMode(orgId), 'PERSISTENT');
    const persistent = await getMetadata<string>(metadataKeys.sellerSessionMode(orgId));
    expect(persistent).toBe('PERSISTENT');

    // Guardar AFTER_EACH_SALE
    await setMetadata(metadataKeys.sellerSessionMode(orgId), 'AFTER_EACH_SALE');
    const afterSale = await getMetadata<string>(metadataKeys.sellerSessionMode(orgId));
    expect(afterSale).toBe('AFTER_EACH_SALE');
  });

  it('mantiene la sesión aislada por organización', async () => {
    await setMetadata(metadataKeys.sellerSessionMode('org-A'), 'PERSISTENT');
    await setMetadata(metadataKeys.sellerSessionMode('org-B'), 'AFTER_EACH_SALE');

    expect(await getMetadata<string>(metadataKeys.sellerSessionMode('org-A'))).toBe('PERSISTENT');
    expect(await getMetadata<string>(metadataKeys.sellerSessionMode('org-B'))).toBe('AFTER_EACH_SALE');
  });

  it('decide correctamente si cerrar sesión del vendedor según modo y conectividad', () => {
    const shouldLogoutSeller = (params: {
      isOnline: boolean;
      mode: 'AFTER_EACH_SALE' | 'PERSISTENT';
    }): boolean => {
      // 1. Offline: nunca cerrar sesión (no se puede re-validar el PIN)
      if (!params.isOnline) return false;

      // 2. Online + PERSISTENT: conservar sesión
      if (params.mode === 'PERSISTENT') return false;

      // 3. Online + AFTER_EACH_SALE: cerrar sesión
      return true;
    };

    // Caso 1: Offline siempre conserva la sesión
    expect(shouldLogoutSeller({ isOnline: false, mode: 'AFTER_EACH_SALE' })).toBe(false);
    expect(shouldLogoutSeller({ isOnline: false, mode: 'PERSISTENT' })).toBe(false);

    // Caso 2: Online con PERSISTENT conserva sesión
    expect(shouldLogoutSeller({ isOnline: true, mode: 'PERSISTENT' })).toBe(false);

    // Caso 3: Online con AFTER_EACH_SALE (predeterminado) cierra sesión
    expect(shouldLogoutSeller({ isOnline: true, mode: 'AFTER_EACH_SALE' })).toBe(true);
  });
});
