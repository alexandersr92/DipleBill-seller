import { useState, useEffect, useRef } from 'react';
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

  const [exchangeRate, setExchangeRate] = useState<number>(() => {
    const saved = localStorage.getItem('usd_exchange_rate');
    return saved ? parseFloat(saved) : 36.5;
  });

  // Refs para auto-focus con teclado
  const cashNioRef = useRef<HTMLInputElement>(null);
  const transBankRef = useRef<HTMLSelectElement>(null);
  const cardBrandRef = useRef<HTMLSelectElement>(null);

  // Metadatos para Pago (Efectivo, Transferencia y Tarjeta unificados)
  const [multipleCashNio, setMultipleCashNio] = useState<string>('');
  const [multipleCashUsd, setMultipleCashUsd] = useState<string>('');
  const [multipleTransferBank, setMultipleTransferBank] = useState<string>('');
  const [multipleTransferRef, setMultipleTransferRef] = useState<string>('');
  const [multipleTransferAmount, setMultipleTransferAmount] = useState<string>('');
  const [multipleCardBrand, setMultipleCardBrand] = useState<string>('Visa');
  const [multipleCardDigits, setMultipleCardDigits] = useState<string>('');
  const [multipleCardRef, setMultipleCardRef] = useState<string>('');
  const [multipleCardAmount, setMultipleCardAmount] = useState<string>('');

  // Auto-focus al abrir el modal o cambiar de pestaña
  useEffect(() => {
    if (step === 2) {
      const timer = setTimeout(() => {
        if (paymentMethod === 'CASH') {
          cashNioRef.current?.focus();
          cashNioRef.current?.select();
        } else if (paymentMethod === 'TRANSFER') {
          transBankRef.current?.focus();
        } else if (paymentMethod === 'CARD') {
          cardBrandRef.current?.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [paymentMethod, step]);

  // Resetear estados al abrir y cargar la tasa de cambio desde el servidor
  useEffect(() => {
    if (open) {
      const isCreditDefault = sellType === SELL_TYPES.CREDITO;
      setStep(1);
      setIsCreditSale(isCreditDefault);
      setPaymentMethod('CASH');

      // Resetear estados de pago
      setMultipleCashNio('');
      setMultipleCashUsd('');
      setMultipleTransferBank('');
      setMultipleTransferRef('');
      setMultipleTransferAmount('');
      setMultipleCardBrand('Visa');
      setMultipleCardDigits('');
      setMultipleCardRef('');
      setMultipleCardAmount('');

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

  // Cálculos de Pago
  const rawMultCashNio = parseFloat(multipleCashNio) || 0;
  const rawMultCashUsd = parseFloat(multipleCashUsd) || 0;
  const rawMultTransferAmt = parseFloat(multipleTransferAmount) || 0;
  const rawMultCardAmt = parseFloat(multipleCardAmount) || 0;

  const totalPaidEquivalent =
    rawMultCashNio + rawMultCashUsd * exchangeRate + rawMultTransferAmt + rawMultCardAmt;
  const changeDueNio = Math.max(totalPaidEquivalent - total, 0);
  const missingAmountNio = Math.max(total - totalPaidEquivalent, 0);

  const formattedTotal = currencyFormatter({ currency: 'NIO', value: total });
  const formattedPaid = currencyFormatter({ currency: 'NIO', value: totalPaidEquivalent });
  const formattedChange = currencyFormatter({ currency: 'NIO', value: changeDueNio });
  const formattedMissing = currencyFormatter({ currency: 'NIO', value: missingAmountNio });

  // Autocompletar el total en un método específico (teniendo en cuenta otros aportes)
  const handleFillExactCash = () => {
    const remaining = Math.max(total - (rawMultTransferAmt + rawMultCardAmt), 0);
    setMultipleCashNio(remaining.toFixed(2));
    setMultipleCashUsd('');
  };

  const handleFillExactTransfer = () => {
    const remaining = Math.max(
      total - (rawMultCashNio + rawMultCashUsd * exchangeRate + rawMultCardAmt),
      0
    );
    setMultipleTransferAmount(remaining.toFixed(2));
  };

  const handleFillExactCard = () => {
    const remaining = Math.max(
      total - (rawMultCashNio + rawMultCashUsd * exchangeRate + rawMultTransferAmt),
      0
    );
    setMultipleCardAmount(remaining.toFixed(2));
  };

  // Validaciones de confirmación
  const canConfirm = () => {
    if (isCreditSale) return true;

    const hasCash = rawMultCashNio > 0 || rawMultCashUsd > 0;
    const hasTransfer = rawMultTransferAmt > 0;
    const hasCard = rawMultCardAmt > 0;

    // Al menos un método de pago debe tener un monto mayor a cero
    if (!hasCash && !hasTransfer && !hasCard) return false;

    // Validaciones específicas de transferencia si tiene monto
    if (hasTransfer) {
      if (!multipleTransferBank || !multipleTransferRef.trim()) return false;
    }

    // Validaciones específicas de tarjeta si tiene monto
    if (hasCard) {
      if (!multipleCardBrand || multipleCardDigits.trim().length !== 4 || !multipleCardRef.trim())
        return false;
    }

    // El total abonado debe cubrir el total de la factura
    return totalPaidEquivalent >= total - 0.01;
  };

  const handleFinalSubmit = () => {
    if (!canConfirm()) return;

    let finalMethod = 'CASH';
    let metadata: any = {};

    if (!isCreditSale) {
      const hasCash = rawMultCashNio > 0 || rawMultCashUsd > 0;
      const hasTransfer = rawMultTransferAmt > 0;
      const hasCard = rawMultCardAmt > 0;

      const activeCount = (hasCash ? 1 : 0) + (hasTransfer ? 1 : 0) + (hasCard ? 1 : 0);

      if (activeCount > 1) {
        finalMethod = 'MULTIPLE';
        const payments: any[] = [];

        // Si hay efectivo, calcular su aporte neto restando el vuelto general
        if (hasCash) {
          const cashBruto = rawMultCashNio + rawMultCashUsd * exchangeRate;
          const cashNeto = Math.max(cashBruto - changeDueNio, 0);
          payments.push({
            method: 'CASH',
            amount: cashNeto,
            paid_nio: rawMultCashNio,
            paid_usd: rawMultCashUsd,
            exchange_rate: exchangeRate,
            change_nio: changeDueNio
          });
        }

        // Si hay transferencia
        if (hasTransfer) {
          payments.push({
            method: 'TRANSFER',
            amount: rawMultTransferAmt,
            bank: multipleTransferBank,
            reference: multipleTransferRef.trim()
          });
        }

        // Si hay tarjeta
        if (hasCard) {
          payments.push({
            method: 'CARD',
            amount: rawMultCardAmt,
            card_brand: multipleCardBrand,
            card_last_four: multipleCardDigits.trim(),
            reference: multipleCardRef.trim()
          });
        }

        metadata = {
          multiple: true,
          payments
        };
      } else if (hasTransfer) {
        finalMethod = 'TRANSFER';
        metadata = {
          bank: multipleTransferBank,
          reference: multipleTransferRef.trim()
        };
      } else if (hasCard) {
        finalMethod = 'CARD';
        metadata = {
          card_last_four: multipleCardDigits.trim(),
          reference: multipleCardRef.trim(),
          card_brand: multipleCardBrand
        };
      } else {
        // Solo Efectivo
        finalMethod = 'CASH';
        metadata = {
          paid_nio: rawMultCashNio,
          paid_usd: rawMultCashUsd,
          exchange_rate: exchangeRate,
          change_nio: changeDueNio
        };
      }
    }

    onConfirm(finalMethod, metadata, isCreditSale);
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

      // Cambiar entre pestañas con F2, F3, F4 o Alt+1, Alt+2, Alt+3
      if (e.key === 'F2' || (e.altKey && e.key === '1')) {
        e.preventDefault();
        setPaymentMethod('CASH');
      }
      if (e.key === 'F3' || (e.altKey && e.key === '2')) {
        e.preventDefault();
        setPaymentMethod('TRANSFER');
      }
      if (e.key === 'F4' || (e.altKey && e.key === '3')) {
        e.preventDefault();
        setPaymentMethod('CARD');
      }

      // Autocompletar restante con F8
      if (e.key === 'F8') {
        e.preventDefault();
        if (paymentMethod === 'CASH') {
          handleFillExactCash();
        } else if (paymentMethod === 'TRANSFER') {
          handleFillExactTransfer();
        } else if (paymentMethod === 'CARD') {
          handleFillExactCard();
        }
      }
    };

    window.addEventListener('keydown', handleModalShortcuts);
    return () => window.removeEventListener('keydown', handleModalShortcuts);
  }, [
    open,
    step,
    isCreditSale,
    paymentMethod,
    multipleCashNio,
    multipleCashUsd,
    multipleTransferBank,
    multipleTransferRef,
    multipleTransferAmount,
    multipleCardBrand,
    multipleCardDigits,
    multipleCardRef,
    multipleCardAmount,
    isSubmitting
  ]);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (next) return;
        if (isSubmitting) return;
        onCancel();
      }}>
      <AlertDialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="border-2 border-slate-400 dark:border-slate-700 max-w-lg rounded-xl overflow-hidden p-0 flex flex-col bg-background select-none shadow-2xl">
        {/* Banner Superior Reactivo */}
        <div
          className={cn(
            'h-2.5 px-6 transition-all duration-300',
            isCreditSale ? 'bg-purple-650' : 'bg-blue-650'
          )}
        />

        <div className="p-6 flex flex-col gap-4">
          {/* Cabecera dinámica según el paso */}
          <div className="flex items-center justify-between border-b border-slate-300 dark:border-slate-850 pb-3">
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                Proceso de Pago
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {step === 1 && '1. Tipo de Venta'}
                {step === 2 && '2. Detalles de Cobro'}
              </h2>
            </div>
            {step > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep((prev) => prev - 1)}
                className="h-8 text-xs flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-900 dark:text-white font-bold border border-slate-300 dark:border-slate-700"
                disabled={isSubmitting}>
                <ChevronLeft className="w-4 h-4" />
                Atrás
              </Button>
            )}
          </div>

          {/* Información del pedido flotante - ALTO CONTRASTE */}
          <div className="flex justify-between items-center bg-slate-200 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-lg p-3.5 text-sm shadow-inner select-none">
            <div className="flex flex-col">
              <span className="text-[11px] uppercase font-black text-slate-800 dark:text-slate-100">
                Cliente
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white truncate max-w-[200px]">
                {clientName}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[11px] uppercase font-black text-slate-800 dark:text-slate-100">
                Total a Cobrar
              </span>
              <span className="text-xl font-black text-slate-900 dark:text-white">
                {formattedTotal}
              </span>
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
                  'p-5 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all',
                  'hover:border-blue-500 hover:bg-blue-50/20 active:scale-95 group',
                  !isCreditSale
                    ? 'border-blue-600 bg-blue-500/10 ring-2 ring-blue-500'
                    : 'border-slate-300 dark:border-slate-800 bg-background text-slate-800 dark:text-slate-200'
                )}>
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all',
                    !isCreditSale
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-105 border-slate-300 dark:border-slate-700'
                  )}>
                  <DollarSign className="w-6 h-6 stroke-[3px]" />
                </div>
                <div className="text-center">
                  <p className="font-black text-sm text-slate-900 dark:text-white">
                    Venta a Contado
                  </p>
                  <p className="text-[10px] font-bold text-slate-700 dark:text-slate-400 mt-0.5">
                    Cobro inmediato
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (
                    !clientName ||
                    clientName === 'Cliente Genérico' ||
                    clientName === 'Consumidor Final'
                  ) {
                    return;
                  }
                  setIsCreditSale(true);
                  setStep(2);
                }}
                disabled={
                  isSubmitting ||
                  !clientName ||
                  clientName === 'Cliente Genérico' ||
                  clientName === 'Consumidor Final'
                }
                className={cn(
                  'p-5 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all relative',
                  (!clientName ||
                    clientName === 'Cliente Genérico' ||
                    clientName === 'Consumidor Final') &&
                    'opacity-50 cursor-not-allowed',
                  'hover:border-purple-500 hover:bg-purple-50/20 active:scale-95 group',
                  isCreditSale
                    ? 'border-purple-600 bg-purple-500/10 ring-2 ring-purple-500'
                    : 'border-slate-300 dark:border-slate-800 bg-background text-slate-800 dark:text-slate-200'
                )}>
                <div
                  className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all',
                    isCreditSale
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-105 border-slate-300 dark:border-slate-700'
                  )}>
                  <Calendar className="w-6 h-6 stroke-[3px]" />
                </div>
                <div className="text-center">
                  <p className="font-black text-sm text-slate-900 dark:text-white">
                    Venta a Crédito
                  </p>
                  <p className="text-[10px] font-bold text-slate-700 dark:text-slate-400 mt-0.5">
                    {!clientName ||
                    clientName === 'Cliente Genérico' ||
                    clientName === 'Consumidor Final'
                      ? 'Requiere cliente registrado'
                      : 'Pago en cuotas diferidas'}
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* PASO 2: DETALLES DE COBRO (CONTADO - MERGED) */}
          {step === 2 && !isCreditSale && (
            <div className="flex flex-col gap-3">
              {/* Selector de Forma de Pago (Pestañas horizontales) - ALTO CONTRASTE */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-lg select-none">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={cn(
                    'py-1.5 text-[11px] font-black rounded-md transition-all flex items-center justify-center gap-1.5 border-2',
                    paymentMethod === 'CASH'
                      ? 'bg-blue-600 text-white shadow-md border-blue-500'
                      : 'text-slate-800 dark:text-slate-200 border-transparent hover:bg-slate-300/60 dark:hover:bg-slate-800/60'
                  )}
                  disabled={isSubmitting}>
                  <Coins className="w-3.5 h-3.5 stroke-[2.5px]" />
                  <span>Efectivo</span>
                  <kbd className="hidden md:inline-block px-1 rounded bg-white/20 text-[9px] font-semibold">
                    F2
                  </kbd>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('TRANSFER')}
                  className={cn(
                    'py-1.5 text-[11px] font-black rounded-md transition-all flex items-center justify-center gap-1.5 border-2',
                    paymentMethod === 'TRANSFER'
                      ? 'bg-blue-600 text-white shadow-md border-blue-500'
                      : 'text-slate-800 dark:text-slate-200 border-transparent hover:bg-slate-300/60 dark:hover:bg-slate-800/60'
                  )}
                  disabled={isSubmitting}>
                  <ArrowRightLeft className="w-3.5 h-3.5 stroke-[2.5px]" />
                  <span>Transf.</span>
                  <kbd className="hidden md:inline-block px-1 rounded bg-white/20 text-[9px] font-semibold">
                    F3
                  </kbd>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={cn(
                    'py-1.5 text-[11px] font-black rounded-md transition-all flex items-center justify-center gap-1.5 border-2',
                    paymentMethod === 'CARD'
                      ? 'bg-blue-600 text-white shadow-md border-blue-500'
                      : 'text-slate-800 dark:text-slate-200 border-transparent hover:bg-slate-300/60 dark:hover:bg-slate-800/60'
                  )}
                  disabled={isSubmitting}>
                  <CreditCard className="w-3.5 h-3.5 stroke-[2.5px]" />
                  <span>Tarjeta</span>
                  <kbd className="hidden md:inline-block px-1 rounded bg-white/20 text-[9px] font-semibold">
                    F4
                  </kbd>
                </button>
              </div>

              {/* Contenedor del método activo */}
              <div className="min-h-[175px] flex flex-col justify-center">
                {/* EFECTIVO PORTION */}
                {paymentMethod === 'CASH' && (
                  <div className="border-2 border-slate-350 dark:border-slate-700 rounded-lg p-3.5 bg-slate-50 dark:bg-slate-950/20">
                    <div className="flex justify-between items-center mb-2.5">
                      <h3 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider flex items-center gap-1.5">
                        <Coins className="w-4 h-4 stroke-[2.5px]" />
                        <span>1. Pago en Efectivo</span>
                      </h3>
                      <button
                        type="button"
                        onClick={handleFillExactCash}
                        disabled={isSubmitting}
                        className="text-[10px] bg-blue-650 hover:bg-blue-700 text-white font-extrabold px-2.5 py-1 rounded border border-blue-500 transition-all uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                        <span>Pagar Restante</span>
                        <kbd className="px-1 rounded bg-white/20 text-[9px] font-semibold">F8</kbd>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <Label
                          htmlFor="multCashNio"
                          className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                          Córdobas (C$)
                        </Label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-xs font-black text-slate-600 dark:text-slate-400">
                            C$
                          </span>
                          <Input
                            ref={cashNioRef}
                            id="multCashNio"
                            type="number"
                            step="any"
                            inputMode="decimal"
                            value={multipleCashNio}
                            onChange={(e) => setMultipleCashNio(e.target.value)}
                            placeholder="0.00"
                            className="pl-8 h-8 text-sm font-bold border-slate-400 dark:border-slate-650 text-slate-900 dark:text-white bg-background"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label
                          htmlFor="multCashUsd"
                          className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                          Dólares ($)
                        </Label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-xs font-black text-slate-600 dark:text-slate-400">
                            $
                          </span>
                          <Input
                            id="multCashUsd"
                            type="number"
                            step="any"
                            inputMode="decimal"
                            value={multipleCashUsd}
                            onChange={(e) => setMultipleCashUsd(e.target.value)}
                            placeholder="0.00"
                            className="pl-8 h-8 text-sm font-bold border-slate-400 dark:border-slate-650 text-slate-900 dark:text-white bg-background"
                            disabled={isSubmitting}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TRANSFERENCIA PORTION */}
                {paymentMethod === 'TRANSFER' && (
                  <div className="border-2 border-slate-350 dark:border-slate-700 rounded-lg p-3.5 bg-slate-50 dark:bg-slate-950/20">
                    <div className="flex justify-between items-center mb-2.5">
                      <h3 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider flex items-center gap-1.5">
                        <ArrowRightLeft className="w-4 h-4 stroke-[2.5px]" />
                        <span>2. Pago por Transferencia</span>
                      </h3>
                      <button
                        type="button"
                        onClick={handleFillExactTransfer}
                        disabled={isSubmitting}
                        className="text-[10px] bg-blue-650 hover:bg-blue-700 text-white font-extrabold px-2.5 py-1 rounded border border-blue-500 transition-all uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                        <span>Copiar Restante</span>
                        <kbd className="px-1 rounded bg-white/20 text-[9px] font-semibold">F8</kbd>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div className="flex flex-col gap-1">
                        <Label
                          htmlFor="multTransBank"
                          className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                          Banco
                        </Label>
                        <select
                          ref={transBankRef}
                          id="multTransBank"
                          value={multipleTransferBank}
                          onChange={(e) => setMultipleTransferBank(e.target.value)}
                          className="h-8 text-xs rounded-md border border-slate-400 dark:border-slate-600 bg-background px-2 font-bold text-slate-900 dark:text-white"
                          disabled={isSubmitting}>
                          <option value="">Seleccione...</option>
                          <option value="BAC">BAC</option>
                          <option value="BANPRO">BANPRO</option>
                          <option value="LAFISE">LAFISE</option>
                          <option value="FICOHSA">FICOHSA</option>
                          <option value="AVANZ">AVANZ</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label
                          htmlFor="multTransRef"
                          className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                          Referencia
                        </Label>
                        <Input
                          id="multTransRef"
                          type="text"
                          placeholder="Nº Referencia"
                          value={multipleTransferRef}
                          onChange={(e) => setMultipleTransferRef(e.target.value)}
                          className="h-8 text-sm font-bold border-slate-400 dark:border-slate-655 text-slate-900 dark:text-white bg-background"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label
                        htmlFor="multTransAmt"
                        className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                        Monto Transferencia (C$)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-xs font-black text-slate-600 dark:text-slate-400">
                          C$
                        </span>
                        <Input
                          id="multTransAmt"
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={multipleTransferAmount}
                          onChange={(e) => setMultipleTransferAmount(e.target.value)}
                          placeholder="0.00"
                          className="pl-8 h-8 text-sm font-bold border-slate-400 dark:border-slate-650 text-slate-900 dark:text-white bg-background"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TARJETA PORTION */}
                {paymentMethod === 'CARD' && (
                  <div className="border-2 border-slate-355 dark:border-slate-700 rounded-lg p-3.5 bg-slate-50 dark:bg-slate-950/20">
                    <div className="flex justify-between items-center mb-2.5">
                      <h3 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 stroke-[2.5px]" />
                        <span>3. Pago con Tarjeta</span>
                      </h3>
                      <button
                        type="button"
                        onClick={handleFillExactCard}
                        disabled={isSubmitting}
                        className="text-[10px] bg-blue-650 hover:bg-blue-700 text-white font-extrabold px-2.5 py-1 rounded border border-blue-500 transition-all uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                        <span>Pagar Restante</span>
                        <kbd className="px-1 rounded bg-white/20 text-[9px] font-semibold">F8</kbd>
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <div className="flex flex-col gap-1">
                        <Label
                          htmlFor="multCardBrand"
                          className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                          Franquicia
                        </Label>
                        <select
                          ref={cardBrandRef}
                          id="multCardBrand"
                          value={multipleCardBrand}
                          onChange={(e) => setMultipleCardBrand(e.target.value)}
                          className="h-8 text-[11px] rounded-md border border-slate-400 dark:border-slate-600 bg-background px-1 font-bold text-slate-900 dark:text-white"
                          disabled={isSubmitting}>
                          <option value="Visa">Visa</option>
                          <option value="Mastercard">Mastercard</option>
                          <option value="AMEX">AMEX</option>
                          <option value="BAC">BAC</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label
                          htmlFor="multCardDigits"
                          className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                          Últimos 4
                        </Label>
                        <Input
                          id="multCardDigits"
                          type="text"
                          maxLength={4}
                          placeholder="0000"
                          value={multipleCardDigits}
                          onChange={(e) => setMultipleCardDigits(e.target.value.replace(/\D/g, ''))}
                          className="pl-2 h-8 text-sm font-bold border-slate-400 dark:border-slate-650 text-slate-900 dark:text-white bg-background"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Label
                          htmlFor="multCardRef"
                          className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                          Voucher
                        </Label>
                        <Input
                          id="multCardRef"
                          type="text"
                          placeholder="Ref"
                          value={multipleCardRef}
                          onChange={(e) => setMultipleCardRef(e.target.value)}
                          className="pl-2 h-8 text-sm font-bold border-slate-400 dark:border-slate-650 text-slate-900 dark:text-white bg-background"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label
                        htmlFor="multCardAmt"
                        className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                        Monto Tarjeta (C$)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-xs font-black text-slate-600 dark:text-slate-400">
                          C$
                        </span>
                        <Input
                          id="multCardAmt"
                          type="number"
                          step="any"
                          inputMode="decimal"
                          value={multipleCardAmount}
                          onChange={(e) => setMultipleCardAmount(e.target.value)}
                          placeholder="0.00"
                          className="pl-8 h-8 text-sm font-bold border-slate-400 dark:border-slate-650 text-slate-900 dark:text-white bg-background"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fila Tasa de Cambio (Solo Lectura) */}
              <div className="flex items-center justify-between border-2 border-slate-350 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/50 p-2.5 rounded-lg text-xs gap-3">
                <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  <span>Tasa de cambio USD/NIO:</span>
                </div>
                <div className="font-extrabold text-slate-900 dark:text-white px-2 py-0.5 bg-background rounded border-2 border-slate-300 dark:border-slate-700 text-xs">
                  C$ {exchangeRate.toFixed(2)}
                </div>
              </div>

              {/* Panel de Vuelto / Saldo Faltante - ALTO CONTRASTE Y GLOBAL */}
              <div
                className={cn(
                  'rounded-xl border-2 p-3.5 flex flex-col items-center justify-center text-center transition-all duration-300 shadow-inner',
                  totalPaidEquivalent >= total - 0.01
                    ? 'bg-emerald-100 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-250'
                    : 'bg-amber-100 dark:bg-amber-950/40 border-amber-500 text-amber-800 dark:text-amber-255'
                )}>
                {totalPaidEquivalent >= total - 0.01 ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-black tracking-wider opacity-75">
                      Cambio a entregar (Vuelto)
                    </span>
                    <span className="text-xl font-black">{formattedChange}</span>
                    <p className="text-[10px] font-bold opacity-80 mt-0.5">
                      Total Ingresado (Global): {formattedPaid}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-black tracking-wider opacity-75">
                      Monto faltante
                    </span>
                    <span className="text-xl font-black">{formattedMissing}</span>
                    <p className="text-[10px] font-bold opacity-80 mt-0.5">
                      Total Ingresado (Global): {formattedPaid}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 2: DETALLES DE PAGO (CRÉDITO) */}
          {step === 2 && isCreditSale && (
            <div className="flex flex-col gap-3 rounded-lg border-2 bg-purple-500/10 border-purple-500/30 p-4 my-2">
              <div className="flex items-start gap-2 text-purple-900 dark:text-purple-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
                <div className="flex flex-col">
                  <span className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">
                    Venta a Crédito
                  </span>
                  <p className="text-xs text-purple-800 dark:text-purple-200 font-bold mt-1">
                    Se generará un saldo pendiente por cobrar a nombre de{' '}
                    <strong className="text-purple-950 dark:text-white underline">
                      {clientName}
                    </strong>
                    .
                  </p>
                </div>
              </div>
              {expirationDate && (
                <div className="border-t border-purple-300 dark:border-purple-800 mt-2 pt-2 text-xs flex justify-between text-purple-800 dark:text-purple-200 font-bold">
                  <span>Vencimiento:</span>
                  <span className="font-extrabold">{expirationDate}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <AlertDialogFooter className="bg-slate-100 dark:bg-slate-900/60 p-4 border-t border-slate-350 dark:border-slate-800 flex flex-row sm:justify-between items-center select-none gap-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-9 px-4 text-xs font-bold border-2 border-slate-350 dark:border-slate-700 text-slate-950 dark:text-white">
            Revisar Factura
          </Button>

          <div className="flex items-center gap-2">
            {step === 2 && (
              <Button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting || !canConfirm()}
                className={cn(
                  'h-9 px-5 text-xs font-bold flex items-center gap-1.5 shadow-md border-2',
                  isCreditSale
                    ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500'
                    : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500'
                )}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <span>Confirmar y Cobrar</span>
                    <kbd className="hidden sm:inline-block px-1 ml-1.5 rounded bg-white/20 text-[9px] font-semibold">
                      Ctrl + Enter
                    </kbd>
                  </>
                )}
              </Button>
            )}

            {step === 1 && (
              <Button
                type="button"
                onClick={() => setStep(2)}
                disabled={
                  isSubmitting ||
                  (isCreditSale &&
                    (!clientName ||
                      clientName === 'Cliente Genérico' ||
                      clientName === 'Consumidor Final'))
                }
                className="h-9 px-5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-500">
                Siguiente
              </Button>
            )}
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
