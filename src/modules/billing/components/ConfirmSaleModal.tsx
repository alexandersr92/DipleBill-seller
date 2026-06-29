import { useState, useEffect } from 'react';
import axiosInstance from '@/helpers/axiosInstance';
import { 
  Loader2, 
  DollarSign, 
  Calendar, 
  Coins, 
  ArrowRightLeft, 
  CreditCard, 
  ChevronLeft, 
  Calculator,
  AlertCircle
} from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  onConfirm: (paymentMethod: string, paymentMetadata: any, isCreditSale: boolean) => void;
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
  const [step, setStep] = useState<number>(1);
  const [isCreditSale, setIsCreditSale] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');

  // Metadatos para Efectivo
  const [paidNio, setPaidNio] = useState<string>('');
  const [paidUsd, setPaidUsd] = useState<string>('');
  const [exchangeRate, setExchangeRate] = useState<number>(() => {
    const saved = localStorage.getItem('usd_exchange_rate');
    return saved ? parseFloat(saved) : 36.5;
  });

  // Metadatos para Transferencia
  const [bank, setBank] = useState<string>('');
  const [transferRef, setTransferRef] = useState<string>('');

  // Metadatos para Tarjeta
  const [cardDigits, setCardDigits] = useState<string>('');
  const [cardRef, setCardRef] = useState<string>('');
  const [cardBrand, setCardBrand] = useState<string>('Visa');



  // Resetear estados al abrir y cargar la tasa de cambio desde el servidor
  useEffect(() => {
    if (open) {
      const isCreditDefault = sellType === SELL_TYPES.CREDITO;
      setStep(1);
      setIsCreditSale(isCreditDefault);
      setPaymentMethod('CASH');
      setPaidNio('');
      setPaidUsd('');
      setBank('');
      setTransferRef('');
      setCardDigits('');
      setCardRef('');
      setCardBrand('Visa');

      // Cargar tasa de cambio oficial configurada por el Owner
      const loadOfficialExchangeRate = async () => {
        try {
          const response = await axiosInstance.get('/v1/settings?key=usd_exchange_rate');
          const records = response.data?.data || response.data || [];
          if (records.length > 0) {
            const val = parseFloat(records[0].value);
            if (val > 0) {
              setExchangeRate(val);
              localStorage.setItem('usd_exchange_rate', val.toString());
            }
          }
        } catch (error) {
          console.error('Error fetching exchange rate from database settings:', error);
        }
      };

      loadOfficialExchangeRate();
    }
  }, [open, sellType]);

  // Cálculos de Efectivo + Vuelto
  const rawPaidNio = parseFloat(paidNio) || 0;
  const rawPaidUsd = parseFloat(paidUsd) || 0;
  const totalPaidEquivalent = rawPaidNio + rawPaidUsd * exchangeRate;
  const changeDueNio = Math.max(totalPaidEquivalent - total, 0);
  const missingAmountNio = Math.max(total - totalPaidEquivalent, 0);

  const formattedTotal = currencyFormatter({ currency: 'NIO', value: total });
  const formattedPaid = currencyFormatter({ currency: 'NIO', value: totalPaidEquivalent });
  const formattedChange = currencyFormatter({ currency: 'NIO', value: changeDueNio });
  const formattedMissing = currencyFormatter({ currency: 'NIO', value: missingAmountNio });



  const handlePayExact = () => {
    setPaidNio(total.toString());
    setPaidUsd('');
  };

  // Validaciones de confirmación
  const canConfirm = () => {
    if (isCreditSale) return true;
    if (paymentMethod === 'CASH') {
      return totalPaidEquivalent >= total - 0.01; // Margen de centavos
    }
    if (paymentMethod === 'TRANSFER') {
      return bank.trim().length > 0 && transferRef.trim().length > 0;
    }
    if (paymentMethod === 'CARD') {
      return cardDigits.trim().length === 4 && cardRef.trim().length > 0;
    }
    return false;
  };

  const handleFinalSubmit = () => {
    if (!canConfirm()) return;

    let metadata: any = {};
    if (!isCreditSale) {
      if (paymentMethod === 'CASH') {
        metadata = {
          paid_nio: rawPaidNio,
          paid_usd: rawPaidUsd,
          exchange_rate: exchangeRate,
          change_nio: changeDueNio
        };
      } else if (paymentMethod === 'TRANSFER') {
        metadata = {
          bank: bank.trim(),
          reference: transferRef.trim()
        };
      } else if (paymentMethod === 'CARD') {
        metadata = {
          card_last_four: cardDigits.trim(),
          reference: cardRef.trim(),
          card_brand: cardBrand
        };
      }
    }

    onConfirm(paymentMethod, metadata, isCreditSale);
  };

  // Atajos de teclado en el modal
  useEffect(() => {
    if (!open) return;

    const handleModalShortcuts = (e: KeyboardEvent) => {
      if (isSubmitting) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
      
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        if (canConfirm()) {
          handleFinalSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleModalShortcuts);
    return () => window.removeEventListener('keydown', handleModalShortcuts);
  }, [open, step, isCreditSale, paymentMethod, paidNio, paidUsd, bank, transferRef, cardDigits, cardRef, cardBrand, isSubmitting]);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (next) return;
        if (isSubmitting) return;
        onCancel();
      }}
    >
      <AlertDialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="border border-sale-accent/40 max-w-lg rounded-xl overflow-hidden p-0 flex flex-col bg-card select-none"
      >
        {/* Banner Superior Reactivo */}
        <div className={cn(
          "h-2 px-6 transition-all duration-300",
          isCreditSale ? "bg-purple-600" : "bg-blue-600"
        )} />

        <div className="p-6 flex flex-col gap-4">
          {/* Cabecera dinámica según el paso */}
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">Proceso de Pago</span>
              <h2 className="text-xl font-bold text-foreground">
                {step === 1 && "1. Tipo de Venta"}
                {step === 2 && "2. Detalles de Cobro"}
              </h2>
            </div>
            {step > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep((prev) => prev - 1)}
                className="h-8 text-xs flex items-center gap-1 hover:bg-muted"
                disabled={isSubmitting}
              >
                <ChevronLeft className="w-4 h-4" />
                Atrás
              </Button>
            )}
          </div>

          {/* Información del pedido flotante */}
          <div className="flex justify-between items-center bg-muted/50 border rounded-lg p-3 text-sm">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Cliente</span>
              <span className="font-semibold text-foreground truncate max-w-[200px]">{clientName}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Total a Cobrar</span>
              <span className="text-lg font-bold text-foreground">{formattedTotal}</span>
            </div>
          </div>

          {/* PASO 1: SELECCIONAR TIPO DE VENTA */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-4 my-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreditSale(false);
                  setStep(2);
                }}
                disabled={isSubmitting}
                className={cn(
                  "p-5 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all",
                  "hover:border-blue-500 hover:bg-blue-50/20 active:scale-95 group",
                  !isCreditSale ? "border-blue-600 bg-blue-500/5 ring-1 ring-blue-500" : "border-border bg-card"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border transition-all",
                  !isCreditSale ? "bg-blue-100 text-blue-600 border-blue-200" : "bg-muted text-muted-foreground border-border"
                )}>
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm text-foreground">Venta a Contado</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Cobro inmediato</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!clientName || clientName === 'Cliente Genérico' || clientName === 'Consumidor Final') {
                    return;
                  }
                  setIsCreditSale(true);
                  setStep(2);
                }}
                disabled={isSubmitting || !clientName || clientName === 'Cliente Genérico' || clientName === 'Consumidor Final'}
                className={cn(
                  "p-5 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all relative",
                  (!clientName || clientName === 'Cliente Genérico' || clientName === 'Consumidor Final') && "opacity-50 cursor-not-allowed",
                  "hover:border-purple-500 hover:bg-purple-50/20 active:scale-95 group",
                  isCreditSale ? "border-purple-600 bg-purple-500/5 ring-1 ring-purple-500" : "border-border bg-card"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center border transition-all",
                  isCreditSale ? "bg-purple-100 text-purple-600 border-purple-200" : "bg-muted text-muted-foreground border-border"
                )}>
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="font-bold text-sm text-foreground">Venta a Crédito</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {(!clientName || clientName === 'Cliente Genérico' || clientName === 'Consumidor Final') 
                      ? "Requiere cliente registrado" 
                      : "Pago en cuotas diferidas"
                    }
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* PASO 2: DETALLES DE COBRO (CONTADO - MERGED) */}
          {step === 2 && !isCreditSale && (
            <div className="flex flex-col gap-4">
              {/* Selector de Forma de Pago (Pestañas horizontales) */}
              <div className="grid grid-cols-3 gap-2 p-1 bg-muted/60 border rounded-lg select-none">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={cn(
                    "py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5",
                    paymentMethod === 'CASH' 
                      ? "bg-background text-foreground shadow-sm border border-secondary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  disabled={isSubmitting}
                >
                  <Coins className="w-3.5 h-3.5 text-blue-600" />
                  Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('TRANSFER')}
                  className={cn(
                    "py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5",
                    paymentMethod === 'TRANSFER' 
                      ? "bg-background text-foreground shadow-sm border border-secondary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  disabled={isSubmitting}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                  Transferencia
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={cn(
                    "py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5",
                    paymentMethod === 'CARD' 
                      ? "bg-background text-foreground shadow-sm border border-secondary" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  disabled={isSubmitting}
                >
                  <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                  Tarjeta
                </button>
              </div>

              {/* DETALLE EFECTIVO */}
              {paymentMethod === 'CASH' && (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5 flex-1">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="paidNio" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Pago en Córdobas</Label>
                        <button
                          type="button"
                          onClick={handlePayExact}
                          disabled={isSubmitting}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Exacto
                        </button>
                      </div>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs font-semibold text-muted-foreground/80">C$</span>
                        <Input
                          id="paidNio"
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={paidNio}
                          onChange={(e) => setPaidNio(e.target.value)}
                          placeholder="0.00"
                          className="pl-8 h-8 text-sm focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="paidUsd" className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Pago en Dólares</Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2 text-xs font-semibold text-muted-foreground/80">$</span>
                        <Input
                          id="paidUsd"
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={paidUsd}
                          onChange={(e) => setPaidUsd(e.target.value)}
                          placeholder="0.00"
                          className="pl-8 h-8 text-sm focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Fila Tasa de Cambio (Solo Lectura) */}
                  <div className="flex items-center justify-between border bg-muted/30 p-2 rounded-lg text-xs gap-3">
                    <div className="flex items-center gap-1 text-muted-foreground font-medium">
                      <Calculator className="w-3.5 h-3.5 text-blue-600" />
                      <span>Tasa de cambio USD/NIO:</span>
                    </div>
                    <div className="font-semibold text-foreground px-2 py-0.5 bg-background rounded border text-xs">
                      C$ {exchangeRate.toFixed(2)}
                    </div>
                  </div>

                  {/* Panel de Vuelto / Saldo Faltante */}
                  <div className={cn(
                    "rounded-xl border p-4 flex flex-col items-center justify-center text-center transition-all duration-300",
                    totalPaidEquivalent >= total - 0.01
                      ? "bg-emerald-500/5 border-emerald-500/25 text-emerald-800"
                      : "bg-amber-500/5 border-amber-500/25 text-amber-800"
                  )}>
                    {totalPaidEquivalent >= total - 0.01 ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">Cambio a entregar</span>
                        <span className="text-xl font-black">{formattedChange}</span>
                        {rawPaidUsd > 0 && (
                          <p className="text-[10px] opacity-80 mt-0.5">
                            Recibido: {formattedPaid} (Equivalente)
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">Monto faltante</span>
                        <span className="text-xl font-black">{formattedMissing}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DETALLE TRANSFERENCIA */}
              {paymentMethod === 'TRANSFER' && (
                <div className="grid grid-cols-2 gap-3 my-1">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="bank" className="text-xs font-semibold text-muted-foreground">Banco de Origen</Label>
                    <Input
                      id="bank"
                      type="text"
                      placeholder="Ej. LAFISE, BANPRO"
                      value={bank}
                      onChange={(e) => setBank(e.target.value)}
                      className="h-8.5 text-sm focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="transferRef" className="text-xs font-semibold text-muted-foreground">Número de Referencia</Label>
                    <Input
                      id="transferRef"
                      type="text"
                      placeholder="Ej. TX-102938"
                      value={transferRef}
                      onChange={(e) => setTransferRef(e.target.value)}
                      className="h-8.5 text-sm focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}

              {/* DETALLE TARJETA */}
              {paymentMethod === 'CARD' && (
                <div className="grid grid-cols-3 gap-3 my-1">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="cardBrand" className="text-xs font-semibold text-muted-foreground">Franquicia / Marca</Label>
                    <select
                      id="cardBrand"
                      value={cardBrand}
                      onChange={(e) => setCardBrand(e.target.value)}
                      className="h-8.5 text-sm rounded-md border border-input bg-background px-3 py-1 text-xs focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue"
                      disabled={isSubmitting}
                    >
                      <option value="Visa">Visa</option>
                      <option value="Mastercard">Mastercard</option>
                      <option value="AMEX">AMEX</option>
                      <option value="BAC">BAC Credomatic</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="cardDigits" className="text-xs font-semibold text-muted-foreground">Últimos 4 Dígitos</Label>
                    <Input
                      id="cardDigits"
                      type="text"
                      maxLength={4}
                      placeholder="0000"
                      value={cardDigits}
                      onChange={(e) => setCardDigits(e.target.value.replace(/\D/g, ''))}
                      className="h-8.5 text-sm focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="cardRef" className="text-xs font-semibold text-muted-foreground">Nº Referencia (Voucher)</Label>
                    <Input
                      id="cardRef"
                      type="text"
                      placeholder="Ej. 129384"
                      value={cardRef}
                      onChange={(e) => setCardRef(e.target.value)}
                      className="h-8.5 text-sm focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 2: DETALLES DE PAGO (CRÉDITO) */}
          {step === 2 && isCreditSale && (
            <div className="flex flex-col gap-3 rounded-lg border bg-purple-500/5 border-purple-500/20 p-4 my-2">
              <div className="flex items-start gap-2 text-purple-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Venta a Crédito</span>
                  <p className="text-xs text-purple-600/90 mt-1">
                    Se generará un saldo pendiente por cobrar a nombre de <strong className="text-purple-800">{clientName}</strong>.
                  </p>
                </div>
              </div>
              {expirationDate && (
                <div className="border-t border-purple-200 mt-2 pt-2 text-xs flex justify-between text-purple-700 font-medium">
                  <span>Vencimiento:</span>
                  <span className="font-bold">{expirationDate}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <AlertDialogFooter className="bg-muted/40 p-4 border-t flex flex-row sm:justify-between items-center select-none gap-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-9 px-4 text-xs font-semibold"
          >
            Revisar Factura
          </Button>

          <div className="flex items-center gap-2">
            {step === 2 && (
              <Button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting || !canConfirm()}
                className={cn(
                  "h-9 px-5 text-xs font-bold flex items-center gap-1.5 shadow-md",
                  isCreditSale 
                    ? "bg-purple-600 hover:bg-purple-700 text-white" 
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <span>Confirmar y Cobrar</span>
                    <kbd className="hidden sm:inline-block px-1 ml-1.5 rounded bg-white/20 text-[9px] font-semibold">Ctrl + Enter</kbd>
                  </>
                )}
              </Button>
            )}
            
            {step === 1 && (
              <Button
                type="button"
                onClick={() => setStep(2)}
                disabled={isSubmitting || (isCreditSale && (!clientName || clientName === 'Cliente Genérico' || clientName === 'Consumidor Final'))}
                className="h-9 px-5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
              >
                Siguiente
              </Button>
            )}
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
