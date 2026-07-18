import { ISingleClient } from '@diplebill/core';
import { db, ICachedClient } from './db';

const toCachedClient = (client: ISingleClient): ICachedClient => ({
  ...client,
  id: client.id ?? '',
  name_lower: (client.name ?? '').toLowerCase()
});

export const mirrorClientsToCache = (clients: ISingleClient[]) => {
  const cached = clients.filter((c) => c.id).map(toCachedClient);
  if (cached.length === 0) return;

  db.transaction('rw', db.clients, async () => {
    await db.clients.clear();
    await db.clients.bulkPut(cached);
  }).catch((error) => {
    if (import.meta.env.DEV) console.warn('No se pudo espejar clientes al caché:', error);
  });
};

export const getClientsFromCache = async (): Promise<ISingleClient[]> => {
  const cached = await db.clients.orderBy('name_lower').toArray();
  return cached.map((entry) => {
    const client = { ...entry } as Partial<ICachedClient>;
    delete client.name_lower;
    return client as ISingleClient;
  });
};
