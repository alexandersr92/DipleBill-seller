import { db } from '@/lib/db';
import axiosInstance from '@/helpers/axiosInstance';

export const downloadCache = async (storeId: string) => {
  if (!navigator.onLine) return;

  try {
    // 1. Descargar productos
    const productsRes = await axiosInstance.get(`/v1/inventories/stores/${storeId}?limit=10000`);
    const productsData = productsRes.data?.data || productsRes.data || [];
    
    const localProducts = productsData.map((item: any) => {
      // item puede ser Inventory, y el product está en item.product
      const product = item.product || item;
      return {
        id: product.id,
        name: product.name,
        code: product.code || null,
        barcode: product.barcode || null,
        category_id: product.category_id || null,
        tag_id: product.tag_id || null,
        price: product.sale_price || product.price || 0,
        currency: product.currency || 'NIO',
        quantity: item.quantity || 0,
        raw_data: item
      };
    });

    // 2. Descargar clientes
    const clientsRes = await axiosInstance.get('/v1/clients?limit=10000');
    const clientsData = clientsRes.data?.data || clientsRes.data || [];
    
    const localClients = clientsData.map((c: any) => ({
      id: c.id,
      name: c.name,
      email: c.email || null,
      phone: c.phone || null,
      document: c.document || null,
      document_type: c.document_type || null,
      raw_data: c,
      is_synced: true
    }));

    // Iniciar transacción para reemplazar datos de caché
    await db.transaction('rw', db.products, db.clients, async () => {
      await db.products.clear();
      if (localProducts.length > 0) {
        await db.products.bulkAdd(localProducts);
      }

      // No borrar clientes locales no sincronizados (is_synced = false)
      const unsyncedClients = await db.clients.filter(c => c.is_synced === false).toArray();
      await db.clients.clear();
      
      const allClients = [...localClients, ...unsyncedClients];
      if (allClients.length > 0) {
        await db.clients.bulkAdd(allClients);
      }
    });

    console.log('[OfflineSync] Caché de productos y clientes descargada con éxito.');
  } catch (error) {
    console.error('[OfflineSync] Error descargando caché:', error);
  }
};
