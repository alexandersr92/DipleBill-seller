import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Play, ShoppingCart, Search, Package, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppBadge } from '@/components/ui/AppBadge';
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
import { IInvoiceDraft } from '../types/draft';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DraftsTableProps {
  drafts: IInvoiceDraft[];
  onDeleteDraft: (id: string) => void;
}

export const DraftsTable = ({ drafts, onDeleteDraft }: DraftsTableProps) => {
  const navigate = useNavigate();
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
      return format(d, 'dd/MM/yyyy HH:mm', { locale: es });
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar en borradores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>
        <div className="text-xs text-muted-foreground self-end sm:self-center">
          Total: <strong className="text-foreground">{filteredDrafts.length}</strong>{' '}
          {filteredDrafts.length === 1 ? 'borrador' : 'borradores'}
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto bg-card">
        <table className="w-full text-xs text-left">
          <thead className="bg-muted/50 border-b text-muted-foreground font-semibold">
            <tr>
              <th className="py-2.5 px-3">Referencia</th>
              <th className="py-2.5 px-3">Fecha</th>
              <th className="py-2.5 px-3">Cliente</th>
              <th className="py-2.5 px-3">Tipo</th>
              <th className="py-2.5 px-3 text-center">Items</th>
              <th className="py-2.5 px-3 text-right">Total</th>
              <th className="py-2.5 px-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {filteredDrafts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  <Package className="h-10 w-10 stroke-[1.2] mx-auto mb-2 text-muted-foreground/40" />
                  <p className="font-semibold text-foreground">No hay borradores guardados</p>
                  <p className="text-[11px] mt-0.5">
                    {searchTerm
                      ? `No hay resultados para "${searchTerm}"`
                      : 'Puedes guardar ventas en borrador desde la pantalla de Venta'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredDrafts.map((draft) => (
                <tr key={draft.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-foreground max-w-[180px] truncate">
                    {draft.reference_name || 'Borrador sin nombre'}
                    {draft.invoice_note && (
                      <div className="text-[10px] text-muted-foreground italic truncate max-w-[160px]">
                        {draft.invoice_note}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-muted-foreground whitespace-nowrap">
                    {formatDateSafely(draft.updated_at || draft.created_at)}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-foreground max-w-[160px] truncate">
                    {draft.client_name || 'EVENTUAL'}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {getSellTypeBadge(draft.sell_type, draft.isCredit)}
                  </td>
                  <td className="py-2.5 px-3 text-center text-muted-foreground">
                    {draft.total_items}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-sale-accent whitespace-nowrap">
                    C$ {draft.grand_total.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/venta?draft_id=${draft.id}`)}
                        className="h-7 px-2 text-xs font-semibold">
                        <Play className="w-3 h-3 mr-1 text-muted-foreground" />
                        Continuar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => navigate(`/venta?draft_id=${draft.id}&action=checkout`)}
                        className="h-7 px-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        Facturar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setDraftToDelete(draft)}
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
    </div>
  );
};
