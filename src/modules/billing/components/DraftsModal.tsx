import { useState, useMemo } from 'react';
import {
  FileText,
  Trash2,
  Play,
  ShoppingCart,
  Search,
  Calendar,
  User,
  Package,
  AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppBadge } from '@/components/ui/AppBadge';
import { IInvoiceDraft } from '../types/draft';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DraftsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drafts: IInvoiceDraft[];
  activeDraftId?: string | null;
  onContinueDraft: (draft: IInvoiceDraft) => void;
  onInvoiceDraft: (draft: IInvoiceDraft) => void;
  onDeleteDraft: (id: string) => void;
}

export const DraftsModal = ({
  open,
  onOpenChange,
  drafts,
  activeDraftId,
  onContinueDraft,
  onInvoiceDraft,
  onDeleteDraft
}: DraftsModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [draftToDelete, setDraftToDelete] = useState<IInvoiceDraft | null>(null);

  const filteredDrafts = useMemo(() => {
    if (!searchTerm.trim()) return drafts;
    const term = searchTerm.toLowerCase();
    return drafts.filter(
      (d) =>
        d.client_name.toLowerCase().includes(term) ||
        (d.reference_name && d.reference_name.toLowerCase().includes(term)) ||
        (d.invoice_note && d.invoice_note.toLowerCase().includes(term)) ||
        d.products.some((p) => p.name.toLowerCase().includes(term))
    );
  }, [drafts, searchTerm]);

  const formatDateSafely = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return format(d, "d 'de' MMM, HH:mm", { locale: es });
    } catch {
      return dateStr;
    }
  };

  const getSellTypeBadge = (sellType: string, isCredit: boolean) => {
    if (sellType === 'proforma') {
      return <AppBadge variant="warning">Proforma</AppBadge>;
    }
    if (isCredit || sellType === 'credito') {
      return <AppBadge variant="info">Crédito</AppBadge>;
    }
    return <AppBadge variant="success">Contado</AppBadge>;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
          <DialogHeader className="pb-3 border-b">
            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold">Borradores de Ventas</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {drafts.length === 0
                      ? 'No hay ventas guardadas en borrador'
                      : `${drafts.length} ${drafts.length === 1 ? 'borrador guardado' : 'borradores guardados'}`}
                  </DialogDescription>
                </div>
              </div>
            </div>

            {drafts.length > 0 && (
              <div className="relative mt-3">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, referencia o producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9 text-xs"
                />
              </div>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
            {drafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Package className="h-12 w-12 stroke-[1.2] text-muted-foreground/40 mb-3" />
                <p className="text-sm font-semibold text-foreground">
                  No tienes borradores guardados
                </p>
                <p className="text-xs max-w-sm mt-1">
                  Cuando estés armando una venta, haz clic en &quot;Guardar borrador&quot; para
                  pausarla y retomarla más tarde.
                </p>
              </div>
            ) : filteredDrafts.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No se encontraron borradores que coincidan con &quot;{searchTerm}&quot;
              </div>
            ) : (
              filteredDrafts.map((draft) => {
                const isActive = activeDraftId === draft.id;
                const productSummary = draft.products
                  .slice(0, 3)
                  .map((p) => `${p.quantity}x ${p.name}`)
                  .join(', ');
                const hasMoreProducts = draft.products.length > 3;

                return (
                  <div
                    key={draft.id}
                    className={`rounded-lg border p-3.5 transition-all flex flex-col gap-2.5 ${
                      isActive
                        ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs'
                        : 'border-border bg-card hover:border-muted-foreground/30'
                    }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-foreground truncate max-w-[240px]">
                            {draft.reference_name || draft.client_name || 'Borrador sin título'}
                          </span>
                          {getSellTypeBadge(draft.sell_type, draft.isCredit)}
                          {isActive && (
                            <span className="text-[10px] bg-amber-500 text-amber-950 font-bold px-1.5 py-0.5 rounded">
                              En pantalla
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {draft.client_name || 'EVENTUAL'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDateSafely(draft.updated_at || draft.created_at)}
                          </span>
                          {draft.seller_name && (
                            <span className="text-muted-foreground/75">
                              Por: {draft.seller_name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-sale-accent">
                          C$ {draft.grand_total.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {draft.total_items} {draft.total_items === 1 ? 'artículo' : 'artículos'}
                        </div>
                      </div>
                    </div>

                    {draft.products.length > 0 && (
                      <div className="text-xs text-muted-foreground bg-muted/40 rounded px-2.5 py-1.5 truncate">
                        <span className="font-medium text-foreground/80">Items: </span>
                        {productSummary}
                        {hasMoreProducts && ` +${draft.products.length - 3} más`}
                      </div>
                    )}

                    {draft.invoice_note && (
                      <div className="text-[11px] text-muted-foreground italic truncate">
                        Nota: {draft.invoice_note}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDraftToDelete(draft)}
                        className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Eliminar
                      </Button>

                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onContinueDraft(draft);
                            onOpenChange(false);
                          }}
                          className="h-8 px-3 text-xs font-semibold">
                          <Play className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                          Continuar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            onInvoiceDraft(draft);
                            onOpenChange(false);
                          }}
                          className="h-8 px-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                          <ShoppingCart className="w-3.5 h-3.5 mr-1" />
                          Facturar
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!draftToDelete}
        onOpenChange={(next) => {
          if (!next) setDraftToDelete(null);
        }}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              ¿Eliminar borrador?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Se eliminará permanentemente el borrador de{' '}
              <strong>
                {draftToDelete?.reference_name || draftToDelete?.client_name || 'esta venta'}
              </strong>{' '}
              con total de C$ {draftToDelete?.grand_total.toFixed(2)}. Esta acción no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="h-8 text-xs">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (draftToDelete) {
                  onDeleteDraft(draftToDelete.id);
                  setDraftToDelete(null);
                }
              }}
              className="h-8 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
