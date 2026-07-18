import { useLiveQuery } from 'dexie-react-hooks';
import { RefreshCw, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/hooks/use-toast';
import { useAppSelector } from '@/store/hooks';
import { db, IOfflineInvoice } from '../db';
import { retryErrored, discardErrored } from '../offlineInvoice';
import { runSync, resetSyncBackoff } from '../syncManager';

interface IOfflineQueueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusLabel: Record<IOfflineInvoice['status'], { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'text-offline-accent' },
  syncing: { label: 'Sincronizando…', className: 'text-primary' },
  synced: { label: 'Sincronizada', className: 'text-primary' },
  error: { label: 'Error', className: 'text-destructive' }
};

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('es-NI', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
};

export const OfflineQueueDialog = ({ open, onOpenChange }: IOfflineQueueDialogProps) => {
  const { toast } = useToast();
  const isOnline = useAppSelector((state) => state.offlineSlice.isOnline);

  const invoices = useLiveQuery(
    () => db.offline_invoices.orderBy('created_at').reverse().toArray(),
    [],
    [] as IOfflineInvoice[]
  );

  const handleRetry = async (localId: string) => {
    await retryErrored(localId);
    if (isOnline) {
      resetSyncBackoff();
      runSync();
    }
  };

  const handleDiscard = async (invoice: IOfflineInvoice) => {
    const confirmed = window.confirm(
      `¿Descartar definitivamente la venta offline ${invoice.offline_number}?\n` +
        'El stock local descontado por esta venta será restituido y la factura NO llegará al servidor.'
    );
    if (!confirmed) return;

    await discardErrored(invoice.local_id);
    toast({ title: `Venta ${invoice.offline_number} descartada.`, variant: 'default' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Facturas offline</DialogTitle>
          <DialogDescription>
            Ventas realizadas sin conexión. Se envían automáticamente al servidor al recuperar el
            internet.
          </DialogDescription>
        </DialogHeader>

        {invoices.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No hay facturas offline registradas.
          </p>
        ) : (
          <div className="max-h-[50vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background">
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-2 font-medium">Número</th>
                  <th className="py-2 pr-2 font-medium">Fecha</th>
                  <th className="py-2 pr-2 font-medium">Cliente</th>
                  <th className="py-2 pr-2 font-medium text-right">Total</th>
                  <th className="py-2 pr-2 font-medium">Estado</th>
                  <th className="py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => {
                  const status = statusLabel[invoice.status];
                  const clientName = (invoice.payload.client_name as string) || '--';
                  const grandTotal = Number(invoice.payload.grand_total ?? 0);
                  return (
                    <tr key={invoice.local_id} className="border-b last:border-b-0 align-top">
                      <td className="py-2 pr-2 font-mono text-xs">
                        {invoice.status === 'synced' && invoice.server_invoice_number ? (
                          <>
                            <span className="font-semibold">{invoice.server_invoice_number}</span>
                            <span className="block text-muted-foreground">
                              ({invoice.offline_number})
                            </span>
                          </>
                        ) : (
                          invoice.offline_number
                        )}
                      </td>
                      <td className="py-2 pr-2 whitespace-nowrap">
                        {formatDate(invoice.created_at)}
                      </td>
                      <td className="py-2 pr-2">{clientName}</td>
                      <td className="py-2 pr-2 text-right whitespace-nowrap">
                        {grandTotal.toFixed(2)}
                      </td>
                      <td className={`py-2 pr-2 font-medium ${status.className}`}>
                        {status.label}
                        {invoice.status === 'error' && invoice.error_message && (
                          <span className="block max-w-[180px] text-xs font-normal text-muted-foreground">
                            {invoice.error_message}
                          </span>
                        )}
                      </td>
                      <td className="py-2">
                        {invoice.status === 'error' && (
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              title="Reintentar"
                              onClick={() => handleRetry(invoice.local_id)}>
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-destructive hover:text-destructive"
                              title="Descartar"
                              onClick={() => handleDiscard(invoice)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
