import { forwardRef, RefObject } from 'react';
import { cn } from '@/lib/utils';
import { SELL_TYPES } from '../types';

interface SaleTypeToggleProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  triggerRef?: RefObject<HTMLButtonElement>;
  id?: string;
  tabIndex?: number;
}

export const SaleTypeToggle = forwardRef<HTMLDivElement, SaleTypeToggleProps>(
  ({ value, onChange, disabled, triggerRef, id, tabIndex }, ref) => {
    const isCredito = value === SELL_TYPES.CREDITO;

    const baseBtn =
      'flex-1 h-10 text-sm font-medium rounded-md flex items-center justify-center gap-2 border transition-colors duration-150';
    const inactive =
      'bg-transparent text-muted-foreground border-transparent hover:text-foreground';
    const active = 'bg-sale-accent text-sale-accent-foreground border-sale-accent';

    return (
      <div
        ref={ref}
        role="tablist"
        aria-label="Tipo de venta"
        className={cn(
          'flex w-full p-1 rounded-md border border-sale-accent/40 bg-sale-accent/5',
          disabled && 'opacity-60 cursor-not-allowed'
        )}
      >
        <button
          ref={triggerRef}
          id={id}
          type="button"
          role="tab"
          aria-selected={!isCredito}
          disabled={disabled}
          tabIndex={tabIndex}
          data-enter-behavior="native"
          onClick={() => onChange(SELL_TYPES.CONTADO)}
          className={cn(baseBtn, !isCredito ? active : inactive)}
        >
          Contado
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isCredito}
          disabled={disabled}
          tabIndex={tabIndex}
          data-enter-behavior="native"
          onClick={() => onChange(SELL_TYPES.CREDITO)}
          className={cn(baseBtn, isCredito ? active : inactive)}
        >
          Crédito
        </button>
      </div>
    );
  }
);

SaleTypeToggle.displayName = 'SaleTypeToggle';
