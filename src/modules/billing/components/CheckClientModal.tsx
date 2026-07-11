import { AlertTriangle, UserCheck, UserPlus, X } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CheckClientModalProps {
  open: boolean;
  newClientName: string;
  similarClients: Array<{ id: string; name: string }>;
  isGeneric: boolean;
  onCancel: () => void;
  onSelectExisting: (client: { id: string; name: string }) => void;
  onConfirmNew: () => void;
}

export const CheckClientModal = ({
  open,
  newClientName,
  similarClients,
  isGeneric,
  onCancel,
  onSelectExisting,
  onConfirmNew
}: CheckClientModalProps) => {
  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!next) onCancel(); }}>
      <AlertDialogContent className="border border-border sm:max-w-md p-6 overflow-hidden">
        <AlertDialogHeader className="relative flex flex-col items-center text-center">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full mb-3",
            isGeneric ? "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-500" : "bg-blue-100 text-theme_blue dark:bg-blue-950/40 dark:text-blue-400"
          )}>
            <AlertTriangle className="h-6 w-6" />
          </div>
          <AlertDialogTitle className="text-lg font-bold text-foreground">
            {isGeneric ? 'Nombre de Cliente Genérico' : 'Clientes Similares Detectados'}
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="mt-2 text-sm text-muted-foreground text-center">
          {isGeneric ? (
            <div className="space-y-3">
              <p>
                Has ingresado un nombre genérico:{' '}
                <strong className="text-foreground">&quot;{newClientName}&quot;</strong>.
              </p>
              <p className="text-xs">
                Para evitar duplicidad en la base de datos, te recomendamos seleccionar el cliente
                genérico ya existente (ej. <strong>&quot;Cliente Contado&quot;</strong>) desde el
                buscador.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p>
                Ya existen clientes registrados con nombres muy similares a{' '}
                <strong className="text-foreground">&quot;{newClientName}&quot;</strong>. Por favor,
                confirma si es alguno de ellos antes de crear un nuevo registro:
              </p>

              {/* Lista de clientes similares */}
              <div className="mt-4 max-h-[160px] overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-muted">
                {similarClients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => onSelectExisting(client)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-all text-left group active:scale-[0.99] focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserCheck className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-theme_blue transition-colors" />
                      <span className="font-medium text-xs text-foreground truncate">{client.name}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-theme_blue opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      Seleccionar
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter className="mt-6 sm:justify-center flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto h-9 text-xs"
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Cancelar y corregir
          </Button>

          {!isGeneric && (
            <Button
              type="button"
              variant="secondary"
              onClick={onConfirmNew}
              className="w-full sm:w-auto h-9 text-xs flex items-center gap-1.5"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Crear como nuevo
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
