import { useState } from 'react';
import { CloudOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { OfflineQueueDialog } from './OfflineQueueDialog';

// Estados: oculto (online y cola vacía) / "Modo Offline (N)" / "Sincronizando N…" /
// "N con error". Click abre el detalle de la cola.
export const OfflineStatusBadge = () => {
  const { isOnline, isSyncing, pendingCount, errorCount } = useAppSelector(
    (state) => state.offlineSlice
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const hasQueue = pendingCount > 0 || errorCount > 0;
  if (isOnline && !hasQueue && !isSyncing) return null;

  let content;
  if (isSyncing) {
    content = (
      <span className="flex items-center gap-1.5 text-primary">
        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        Sincronizando {pendingCount > 0 ? `${pendingCount} factura(s)…` : '…'}
      </span>
    );
  } else if (!isOnline) {
    content = (
      <span className="flex items-center gap-1.5 text-offline-accent">
        <CloudOff className="h-3.5 w-3.5" />
        Modo Offline{pendingCount > 0 ? ` (${pendingCount} en cola)` : ''}
      </span>
    );
  } else if (errorCount > 0) {
    content = (
      <span className="flex items-center gap-1.5 text-destructive">
        <AlertTriangle className="h-3.5 w-3.5" />
        {errorCount} factura(s) con error
      </span>
    );
  } else {
    content = (
      <span className="flex items-center gap-1.5 text-offline-accent">
        <CloudOff className="h-3.5 w-3.5" />
        {pendingCount} factura(s) por sincronizar
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsDialogOpen(true)}
        className={`flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
          errorCount > 0 && isOnline && !isSyncing
            ? 'border-destructive/40 bg-destructive/10 hover:bg-destructive/20'
            : isSyncing
              ? 'border-primary/40 bg-primary/10 hover:bg-primary/20'
              : 'border-offline-accent/40 bg-offline-accent-soft hover:bg-offline-accent/20'
        }`}>
        {content}
      </button>
      <OfflineQueueDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  );
};
