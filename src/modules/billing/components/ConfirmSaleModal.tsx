import { useRef } from 'react';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SELL_TYPES } from '../types';
import { currencyFormatter } from '../helpers';

interface ConfirmSaleModalProps {
  open: boolean;
  sellType: string;
  clientName: string;
  total: number;
  expirationDate?: string;
  isSubmitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmSaleModal = ({
  open,
  sellType,
  clientName,
  total,
  expirationDate,
  isSubmitting = false,
  onCancel,
  onConfirm
}: ConfirmSaleModalProps) => {
  const isCredito = sellType === SELL_TYPES.CREDITO;
  const formattedTotal = currencyFormatter({ currency: 'NIO', value: total });
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (next) return;
        if (isSubmitting) return;
        onCancel();
      }}>
      <AlertDialogContent
        data-sell-type={sellType}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          window.setTimeout(() => confirmButtonRef.current?.focus(), 0);
        }}
        onEscapeKeyDown={(event) => {
          if (isSubmitting) event.preventDefault();
        }}
        className={cn('border border-sale-accent/40 sm:max-w-md')}>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Confirmar venta
          </p>
          <h2 className="mt-1 text-xl font-semibold text-sale-accent-text">
            Vas a registrar una venta de
          </h2>
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-sale-accent-soft text-sale-accent-text border border-sale-accent-border">
              {isCredito ? 'Crédito' : 'Contado'}
            </span>
            <span className="text-2xl font-bold">{formattedTotal}</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Cliente: <span className="text-foreground font-medium">{clientName}</span>
          </p>
          {!isCredito && (
            <p className="mt-3 text-xs text-muted-foreground">
              ¿El cliente está pagando en este momento? Si pagará después, cambia a{' '}
              <strong className="text-sale-accent-text">Crédito</strong>.
            </p>
          )}
          {isCredito && expirationDate && (
            <p className="mt-3 text-xs text-muted-foreground">
              Se generará un crédito a nombre del cliente con vencimiento{' '}
              <strong className="text-foreground">{expirationDate}</strong>.
            </p>
          )}
        </div>
        <AlertDialogFooter className="sm:justify-end sm:gap-2">
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={onCancel}>
            Revisar
          </Button>
          <Button
            ref={confirmButtonRef}
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="bg-sale-accent text-sale-accent-foreground hover:bg-sale-accent/90">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando…
              </>
            ) : (
              'Confirmar venta'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
