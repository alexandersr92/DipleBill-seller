import { useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useToast } from '@/components/hooks/use-toast';
import { registerConnectivityListeners } from './connectivity';
import { getUnsyncedCounts } from './offlineInvoice';
import { runPrecache } from './precache';
import { runSync, resetSyncBackoff } from './syncManager';
import { setCounts } from './slices/offlineSlice';

const PRECACHE_INTERVAL_MS = 10 * 60 * 1000;

// Componente global sin UI: detección de conectividad, precalentamiento de
// caché y disparo de la sincronización de la cola offline.
export const OfflineManager = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const isOnline = useAppSelector((state) => state.offlineSlice.isOnline);
  const isSellerAuthenticated = useAppSelector((state) => state.userSlice.isSellerAuthenticated);
  const storeId = useAppSelector(
    (state) => state.storeSlice.store?.id || localStorage.getItem('currentStoreId') || ''
  );
  const wasOnlineRef = useRef(isOnline);
  const wasSellerAuthRef = useRef(isSellerAuthenticated);

  // Contadores reactivos de la cola (se actualizan ante cualquier cambio en Dexie).
  const counts = useLiveQuery(getUnsyncedCounts, [], { pending: 0, errors: 0 });

  useEffect(() => {
    dispatch(setCounts({ pending: counts.pending, errors: counts.errors }));
  }, [counts.pending, counts.errors, dispatch]);

  // Listeners online/offline (con verificación por ping).
  useEffect(() => registerConnectivityListeners(), []);

  // Sincronizar al pasar de offline a online, y al arrancar online con cola pendiente.
  useEffect(() => {
    const wasOnline = wasOnlineRef.current;
    wasOnlineRef.current = isOnline;

    if (!isOnline) return;

    const trigger = async () => {
      const { pending } = await getUnsyncedCounts();
      if (pending === 0) return;

      resetSyncBackoff();
      const summary = await runSync();
      if (summary && (summary.synced > 0 || summary.errors > 0)) {
        toast({
          title:
            summary.errors > 0
              ? `Sincronización: ${summary.synced} factura(s) enviada(s), ${summary.errors} con error.`
              : `Sincronización completa: ${summary.synced} factura(s) enviada(s) al servidor.`,
          variant: summary.errors > 0 ? 'error' : 'success'
        });
      }
    };

    // Transición offline→online o primer montaje estando online.
    if (!wasOnline || wasOnline === isOnline) {
      trigger();
    }
  }, [isOnline]);

  // Al re-autenticarse (p. ej. tras un 401 que deslogueó a mitad de sync), las
  // facturas quedaron en 'pending' y deben reintentarse sin esperar un reload
  // ni un cambio de red. Se dispara sync cuando el cajero vuelve a entrar.
  useEffect(() => {
    const wasAuth = wasSellerAuthRef.current;
    wasSellerAuthRef.current = isSellerAuthenticated;

    if (!isSellerAuthenticated || wasAuth || !isOnline) return;

    (async () => {
      const { pending } = await getUnsyncedCounts();
      if (pending === 0) return;
      resetSyncBackoff();
      await runSync();
    })();
  }, [isSellerAuthenticated, isOnline]);

  // Precalentamiento de caché: al montar (autenticado y online) y cada 10 minutos.
  useEffect(() => {
    if (!isOnline || !isSellerAuthenticated || !storeId) return;

    runPrecache(storeId).catch(() => undefined);

    const interval = setInterval(() => {
      runPrecache(storeId).catch(() => undefined);
    }, PRECACHE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isOnline, isSellerAuthenticated, storeId]);

  return null;
};
