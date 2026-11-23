import { useState, useEffect } from 'react';
import { Bookmark, FileText } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SaveDraftModalProps {
  open: boolean;
  onCancel: () => void;
  onSave: (referenceName?: string) => void;
  clientName: string;
  totalItems: number;
  grandTotal: number;
  initialReference?: string;
  isExistingDraft?: boolean;
}

export const SaveDraftModal = ({
  open,
  onCancel,
  onSave,
  clientName,
  totalItems,
  grandTotal,
  initialReference = '',
  isExistingDraft = false
}: SaveDraftModalProps) => {
  const [referenceName, setReferenceName] = useState(initialReference);

  useEffect(() => {
    if (open) {
      setReferenceName(initialReference || '');
    }
  }, [open, initialReference]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSave(referenceName.trim() || undefined);
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}>
      <AlertDialogContent className="border border-border sm:max-w-md p-6">
        <form onSubmit={handleSubmit}>
          <AlertDialogHeader className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full mb-2 bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-500">
              <Bookmark className="h-6 w-6" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-foreground">
              {isExistingDraft ? 'Actualizar Borrador' : 'Guardar Venta como Borrador'}
            </AlertDialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Esta venta se guardará localmente sin descontar stock ni alterar la caja. Podrás
              retomarla o facturarla en cualquier momento.
            </p>
          </AlertDialogHeader>

          <div className="my-4 space-y-3">
            <div className="rounded-lg border bg-muted/40 p-3 text-xs space-y-1.5">
              <div className="flex justify-between text-muted-foreground">
                <span>Cliente:</span>
                <span className="font-semibold text-foreground truncate max-w-[200px]">
                  {clientName || 'EVENTUAL'}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Productos:</span>
                <span className="font-semibold text-foreground">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground pt-1 border-t border-border/50">
                <span>Total:</span>
                <span className="font-bold text-sale-accent text-sm">
                  C$ {grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="draft_reference" className="text-xs font-semibold">
                Nombre o referencia (opcional)
              </Label>
              <Input
                id="draft_reference"
                autoFocus
                placeholder="Ej. Mesa 4, Esperando transferencia, Don Juan..."
                value={referenceName}
                onChange={(e) => setReferenceName(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="w-full sm:w-auto h-9 text-xs">
              Cancelar
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto h-9 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-amber-950 border-0">
              <FileText className="w-3.5 h-3.5 mr-1.5" />
              {isExistingDraft ? 'Guardar Cambios' : 'Guardar Borrador'}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};
