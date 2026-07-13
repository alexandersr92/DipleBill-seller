import { useEffect } from 'react';
import { db } from '@/lib/db';
import { useAppDispatch } from '@/store/hooks';
import { useToast } from '@/components/hooks/use-toast';
import { addClientFromInvoice } from '@/modules/clients/services/clientsThunks';
import { createBilling } from '@/modules/billing/services/billingThunks';
import { closeCashSession } from '@/modules/billing/slices/cashSlice';

export function useOfflineSyncManager() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  useEffect(() => {
    const processQueue = async () => {
      if (!navigator.onLine) return;

      const queue = await db.sync_queue.where('status').equals('pending').sortBy('created_at');
      if (queue.length === 0) return;

      toast({
        title: 'Sincronizando datos...',
        description: `Enviando ${queue.length} registros pendientes.`,
        variant: 'default',
        duration: 3000
      });

      let successCount = 0;
      let errorCount = 0;

      // Un mapa para actualizar los temp_id de clientes locales a IDs reales de la BD
      const clientIdsMap = new Map<string, string>();

      for (const item of queue) {
        try {
          if (item.action === 'CREATE_CLIENT') {
            const tempId = item.payload.temp_id;
            const clientData = {
              name: item.payload.name,
              wholesaler: item.payload.wholesaler,
              stores: item.payload.stores
            };
            
            const res = await dispatch(addClientFromInvoice(clientData)).unwrap();
            
            if (tempId && res.id) {
              clientIdsMap.set(tempId, res.id);
            }

            await db.sync_queue.delete(item.id);
            successCount++;
          } 
          else if (item.action === 'CREATE_INVOICE') {
            // Reemplazar client_id si es uno creado localmente
            if (item.payload.client_id && clientIdsMap.has(item.payload.client_id)) {
              item.payload.client_id = clientIdsMap.get(item.payload.client_id);
            }

            // Remover el fake id de la factura antes de enviar
            const { id, invoice_number, ...billingData } = item.payload;

            await dispatch(createBilling(billingData)).unwrap();
            
            await db.sync_queue.delete(item.id);
            successCount++;
          } 
          else if (item.action === 'CLOSE_CASH_SESSION') {
            await dispatch(closeCashSession(item.payload)).unwrap();
            
            await db.sync_queue.delete(item.id);
            successCount++;
          }
        } catch (error: any) {
          console.error(`Error procesando acción ${item.action}:`, error);
          await db.sync_queue.update(item.id, {
            status: 'failed',
            error: error?.message || 'Error desconocido'
          });
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Sincronización Completada',
          description: `Se sincronizaron ${successCount} registros exitosamente.`,
          variant: 'success'
        });
      }

      if (errorCount > 0) {
        toast({
          title: 'Error de Sincronización',
          description: `Hubo problemas al sincronizar ${errorCount} registros.`,
          variant: 'error'
        });
      }
    };

    const handleOnline = () => {
      processQueue();
    };

    window.addEventListener('online', handleOnline);

    // Intentar sincronizar al montar el hook si hay internet
    if (navigator.onLine) {
      processQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [dispatch, toast]);
}
