import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/helpers/axiosInstance';
import { useToast } from '@/components/hooks/use-toast';
import { useAppSelector } from '@/store/hooks';
import {
  Search,
  Loader2,
  Coins,
  ArrowRightLeft,
  CreditCard,
  AlertCircle,
  FileText,
  User,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { currencyFormatter } from '../helpers';

interface CreditSearchItem {
  id: string;
  credit_number: string;
  client_name: string;
  invoice_number: string;
  total: number;
  debt: number;
  created_at: string;
}

export default function CreditPayments() {
  const { toast } = useToast();
  const { store } = useAppSelector((state) => state.storeSlice);
  const sellerId =
    useAppSelector((state) => state.userSlice.sellerId) || localStorage.getItem('seller_id') || '';
  const sellerName =
    useAppSelector((state) => state.userSlice.sellerName) ||
    localStorage.getItem('seller_name') ||
    '';

  const [searchQuery, setSearchQuery] = useState('');
  const [credits, setCredits] = useState<CreditSearchItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<CreditSearchItem | null>(null);

  // Payment states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'CARD'>('CASH');

  // Exchange rate from localStorage
  const [exchangeRate] = useState<number>(() => {
    const saved = localStorage.getItem('usd_exchange_rate');
    return saved ? parseFloat(saved) : 36.5;
  });

  // Refs for keyboard navigation
  const cashNioRef = useRef<HTMLInputElement>(null);
  const transBankRef = useRef<HTMLSelectElement>(null);
  const transAmtRef = useRef<HTMLInputElement>(null);
  const cardBrandRef = useRef<HTMLSelectElement>(null);
  const cardAmtRef = useRef<HTMLInputElement>(null);

  // Metadatos para Pago (Efectivo, Transferencia y Tarjeta)
  const [multipleCashNio, setMultipleCashNio] = useState<string>('');
  const [multipleCashUsd, setMultipleCashUsd] = useState<string>('');
  const [multipleTransferBank, setMultipleTransferBank] = useState<string>('');
  const [multipleTransferRef, setMultipleTransferRef] = useState<string>('');
  const [multipleTransferAmount, setMultipleTransferAmount] = useState<string>('');
  const [multipleCardBrand, setMultipleCardBrand] = useState<string>('Visa');
  const [multipleCardDigits, setMultipleCardDigits] = useState<string>('');
  const [multipleCardRef, setMultipleCardRef] = useState<string>('');
  const [multipleCardAmount, setMultipleCardAmount] = useState<string>('');

  // Auto-focus when tab changes or credit is selected
  useEffect(() => {
    if (selectedCredit) {
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
  }, [paymentMethod, selectedCredit]);

  // Keyboard shortcuts inside the form
  useEffect(() => {
    if (!selectedCredit) return;

    const handleShortcuts = (e: KeyboardEvent) => {
      if (isSubmitting) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelPayment();
      }

      // F2/F3/F4 and Alt+1/2/3 to switch tabs
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

      // Autocomplete with F8
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

    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, [
    selectedCredit,
    isSubmitting,
    paymentMethod,
    multipleCashNio,
    multipleCashUsd,
    multipleTransferAmount,
    multipleCardAmount,
    exchangeRate
  ]);

  // Search logic
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) {
      setCredits([]);
      return;
    }
    setIsSearching(true);
    setSelectedCredit(null);
    try {
      const response = await axiosInstance.get(
        `/v1/credits/search-active?search=${encodeURIComponent(searchQuery)}`
      );
      setCredits(response.data || []);
    } catch (err: any) {
      toast({
        title: 'Búsqueda sin resultados',
        description: err.response?.data?.message || 'No se encontraron créditos activos.',
        variant: 'destructive'
      });
      setCredits([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectCredit = (credit: CreditSearchItem) => {
    setSelectedCredit(credit);
    setNotes('');
    setPaymentMethod('CASH');

    // Reset payment values: all inputs should be empty by default
    setMultipleCashNio('');
    setMultipleCashUsd('');
    setMultipleTransferBank('');
    setMultipleTransferRef('');
    setMultipleTransferAmount('');
    setMultipleCardBrand('Visa');
    setMultipleCardDigits('');
    setMultipleCardRef('');
    setMultipleCardAmount('');
  };

  const handleCancelPayment = () => {
    setSelectedCredit(null);
    setNotes('');
  };

  // Convert string amount variables safely
  const rawCashNio = parseFloat(multipleCashNio) || 0;
  const rawCashUsd = parseFloat(multipleCashUsd) || 0;
  const rawTransferAmt = parseFloat(multipleTransferAmount) || 0;
  const rawCardAmt = parseFloat(multipleCardAmount) || 0;

  // Calculadoras de totales por pestaña
  const totalPaidInCash = rawCashNio + rawCashUsd * exchangeRate;

  // Total paid is the sum of all inputs across all tabs
  const totalPaidInNio = totalPaidInCash + rawTransferAmt + rawCardAmt;

  const targetDebt = selectedCredit?.debt || 0;
  const isOverpaid = totalPaidInNio > targetDebt;

  // Auto-completar abono exacto por pestaña (restando lo ingresado en otras)
  const handleFillExactCash = () => {
    const otherPayments = rawTransferAmt + rawCardAmt;
    const diff = Math.max(targetDebt - otherPayments, 0);
    setMultipleCashNio(diff.toFixed(2));
    setMultipleCashUsd('');
  };

  const handleFillExactTransfer = () => {
    const otherPayments = totalPaidInCash + rawCardAmt;
    const diff = Math.max(targetDebt - otherPayments, 0);
    setMultipleTransferAmount(diff.toFixed(2));
  };

  const handleFillExactCard = () => {
    const otherPayments = totalPaidInCash + rawTransferAmt;
    const diff = Math.max(targetDebt - otherPayments, 0);
    setMultipleCardAmount(diff.toFixed(2));
  };

  // Validaciones
  const canSubmit = () => {
    if (!selectedCredit || isSubmitting) return false;
    if (totalPaidInNio <= 0 || isOverpaid) return false;

    if (rawTransferAmt > 0) {
      if (!multipleTransferBank || !multipleTransferRef.trim()) return false;
    }

    if (rawCardAmt > 0) {
      if (!multipleCardBrand || multipleCardDigits.trim().length !== 4 || !multipleCardRef.trim())
        return false;
    }

    return true;
  };

  const handleSubmitPayment = async () => {
    if (!canSubmit() || !selectedCredit) return;

    setIsSubmitting(true);

    const hasCash = rawCashNio > 0 || rawCashUsd > 0;
    const hasTransfer = rawTransferAmt > 0;
    const hasCard = rawCardAmt > 0;

    const activeCount = (hasCash ? 1 : 0) + (hasTransfer ? 1 : 0) + (hasCard ? 1 : 0);

    // Formular el payload según las reglas de métodos de pago
    let finalMethod = 'CASH';
    let metadata: any = null;

    if (activeCount > 1) {
      finalMethod = 'MULTIPLE';
      const payments = [];
      if (hasCash) {
        payments.push({
          method: 'CASH',
          amount: totalPaidInCash,
          paid_nio: rawCashNio,
          paid_usd: rawCashUsd,
          change_nio: 0
        });
      }
      if (hasTransfer) {
        payments.push({
          method: 'TRANSFER',
          amount: rawTransferAmt,
          bank: multipleTransferBank,
          reference: multipleTransferRef.trim()
        });
      }
      if (hasCard) {
        payments.push({
          method: 'CARD',
          amount: rawCardAmt,
          card_brand: multipleCardBrand,
          card_last_four: multipleCardDigits.trim(),
          reference: multipleCardRef.trim()
        });
      }
      metadata = {
        payments,
        exchange_rate: exchangeRate
      };
    } else if (hasTransfer) {
      finalMethod = 'TRANSFER';
      metadata = {
        bank: multipleTransferBank,
        reference: multipleTransferRef.trim(),
        amount: rawTransferAmt
      };
    } else if (hasCard) {
      finalMethod = 'CARD';
      metadata = {
        card_brand: multipleCardBrand,
        card_last_four: multipleCardDigits.trim(),
        reference: multipleCardRef.trim(),
        amount: rawCardAmt
      };
    } else {
      finalMethod = 'CASH';
      metadata = {
        paid_nio: rawCashNio,
        paid_usd: rawCashUsd,
        exchange_rate: exchangeRate,
        change_nio: 0
      };
    }

    const cashSessionId = localStorage.getItem('active_cash_session_id') || null;

    try {
      const payload = {
        credits_id: [selectedCredit.id],
        amount: totalPaidInNio,
        notes: notes,
        seller_id: sellerId || null,
        payment_method: finalMethod,
        payment_metadata: metadata,
        cash_session_id: cashSessionId
      };

      await axiosInstance.post('/v1/credits/payment', payload);

      toast({
        title: 'Abono Registrado',
        description: `Se abonó correctamente C$ ${totalPaidInNio.toFixed(2)} al crédito ${selectedCredit.credit_number}.`,
        className: 'bg-green-600 border-green-500 text-white'
      });

      // Imprimir comprobante
      handlePrintReceipt(selectedCredit, totalPaidInNio, notes, finalMethod, metadata);

      // Limpiar y refrescar la búsqueda
      setSelectedCredit(null);
      handleSearch();
    } catch (err: any) {
      toast({
        title: 'Error al procesar el pago',
        description: err.response?.data?.message || 'No se pudo procesar el pago del crédito.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = (
    credit: CreditSearchItem,
    amount: number,
    notes: string,
    method: string,
    metadata: any
  ) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let methodStr = 'Efectivo';
    if (method === 'TRANSFER') methodStr = `Transferencia (${metadata?.bank || ''})`;
    if (method === 'CARD') methodStr = `Tarjeta (${metadata?.card_brand || ''})`;

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: monospace; font-size: 12px; margin: 10px; width: 280px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .hr { border-top: 1px dashed #000; margin: 10px 0; }
            table { width: 100%; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="center bold">${store?.name || 'DipleBill POS'}</div>
          <div class="center">${store?.address || ''}</div>
          <div class="center">Telf: ${store?.phone || ''}</div>
          <div class="hr"></div>
          <div class="center bold">COMPROBANTE DE ABONO</div>
          <div class="hr"></div>
          <table>
            <tr><td>Recibo:</td><td class="right">${credit.credit_number}</td></tr>
            <tr><td>Factura Ref:</td><td class="right">${credit.invoice_number}</td></tr>
            <tr><td>Fecha:</td><td class="right">${new Date().toLocaleDateString()}</td></tr>
            <tr><td>Vendedor:</td><td class="right">${sellerName || 'Cajero'}</td></tr>
          </table>
          <div class="hr"></div>
          <table>
            <tr><td class="bold">Cliente:</td><td class="right">${credit.client_name}</td></tr>
            <tr><td>Deuda Anterior:</td><td class="right">C$ ${credit.debt.toFixed(2)}</td></tr>
            <tr><td class="bold">Monto Abonado:</td><td class="bold right">C$ ${amount.toFixed(2)}</td></tr>
            <tr><td class="bold">Nuevo Saldo:</td><td class="bold right">C$ ${(credit.debt - amount).toFixed(2)}</td></tr>
          </table>
          <div class="hr"></div>
          <div>Mód. Pago: ${methodStr}</div>
          ${notes ? `<div>Nota: ${notes}</div>` : ''}
          <div class="hr"></div>
          <div class="center bold" style="margin-top: 30px;">Firma del Cliente</div>
          <div style="margin-top: 40px; border-top: 1px solid #000; width: 70%; margin-left: auto; margin-right: auto;"></div>
          <div class="center" style="margin-top: 20px;">¡Gracias por su pago!</div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow?.print();
      printWindow?.close();
    }, 250);
  };

  return (
    <div className="flex-1 flex flex-col gap-4 p-2 max-w-5xl mx-auto w-full select-none">
      <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-blue-600 dark:text-blue-400 stroke-[2.5px]" />
            Abonos a Créditos
          </h1>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Registra cobros y abonos de facturas de forma rápida
          </p>
        </div>
      </div>

      {!selectedCredit ? (
        <div className="flex flex-col gap-4">
          {/* SEARCH BAR */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-600 dark:text-slate-400" />
              <Input
                type="text"
                placeholder="Buscar por Cliente, Factura (ej: AD-000015) o Código de Crédito (ej: CR-000001)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm font-bold border-slate-300 dark:border-slate-700 bg-background text-slate-900 dark:text-white"
              />
            </div>
            <Button
              type="submit"
              disabled={isSearching}
              className="h-9 px-4 font-black uppercase text-xs tracking-wider bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5">
              {isSearching ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              <span>Buscar</span>
            </Button>
          </form>

          {/* CREDITS RESULTS LIST */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900/10">
            <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/30">
              <h2 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Créditos Activos Encontrados ({credits.length})
              </h2>
            </div>
            {isSearching ? (
              <div className="py-12 flex justify-center items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
                <span>Buscando créditos en la base de datos...</span>
              </div>
            ) : credits.length === 0 ? (
              <div className="py-12 text-center text-sm font-medium text-slate-600 dark:text-slate-400">
                Usa el buscador superior para localizar el crédito del cliente.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
                {credits.map((credit) => (
                  <div
                    key={credit.id}
                    onClick={() => handleSelectCredit(credit)}
                    className="border-2 border-slate-350 dark:border-slate-800 rounded-lg p-3.5 hover:border-blue-500 hover:bg-blue-500/5 cursor-pointer transition-all active:scale-[0.99] flex flex-col justify-between bg-background animate-in fade-in-50 duration-200">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase border border-slate-400/25">
                        {credit.credit_number}
                      </span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-black tracking-wider uppercase">
                        Factura: #{credit.invoice_number}
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5 mb-3.5">
                      <User className="w-4 h-4 text-slate-500" />
                      {credit.client_name}
                    </h3>
                    <div className="flex justify-between items-center border-t pt-2.5 border-slate-200 dark:border-slate-800">
                      <div>
                        <p className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                          Total Inicial
                        </p>
                        <p className="text-xs font-black text-slate-700 dark:text-slate-300">
                          {currencyFormatter({ currency: 'NIO', value: credit.total })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider text-right">
                          Saldo Pendiente
                        </p>
                        <p className="text-sm font-black text-blue-600 dark:text-blue-400">
                          {currencyFormatter({ currency: 'NIO', value: credit.debt })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* PAYMENT SCREEN */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* GENERAL DEBT CARD */}
            <div className="border-2 border-slate-350 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-900/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      {selectedCredit.credit_number}
                    </span>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                      Ref Factura: {selectedCredit.invoice_number}
                    </span>
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {selectedCredit.client_name}
                  </h2>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Saldo Pendiente
                </p>
                <p className="text-xl font-black text-blue-600 dark:text-blue-400">
                  {currencyFormatter({ currency: 'NIO', value: selectedCredit.debt })}
                </p>
              </div>
            </div>

            {/* PAYMENT TABS SELECTOR */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 rounded-lg select-none">
              {(['CASH', 'TRANSFER', 'CARD'] as const).map((method) => {
                let label = 'Efectivo';
                let icon = <Coins className="w-3.5 h-3.5" />;
                let kbd = 'F2';
                if (method === 'TRANSFER') {
                  label = 'Transf.';
                  icon = <ArrowRightLeft className="w-3.5 h-3.5" />;
                  kbd = 'F3';
                } else if (method === 'CARD') {
                  label = 'Tarjeta';
                  icon = <CreditCard className="w-3.5 h-3.5" />;
                  kbd = 'F4';
                }

                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={cn(
                      'py-2 text-[11px] font-black rounded-md transition-all flex items-center justify-center gap-1.5 border-2',
                      paymentMethod === method
                        ? 'bg-blue-600 text-white shadow-md border-blue-500'
                        : 'text-slate-800 dark:text-slate-200 border-transparent hover:bg-slate-300/60 dark:hover:bg-slate-800/60'
                    )}
                    disabled={isSubmitting}>
                    {icon}
                    <span>{label}</span>
                    <kbd className="hidden md:inline-block px-1 rounded bg-white/20 text-[9px] font-semibold">
                      {kbd}
                    </kbd>
                  </button>
                );
              })}
            </div>

            {/* TABS CONTAINER */}
            <div className="border-2 border-slate-300 dark:border-slate-800 rounded-lg p-4 bg-background">
              {/* EFECTIVO TAB */}
              {paymentMethod === 'CASH' && (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider flex items-center gap-1.5">
                      <Coins className="w-4 h-4" />
                      <span>Pago en Efectivo</span>
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleFillExactCash}
                      className="h-6 text-[10px] bg-blue-650 hover:bg-blue-700 text-white font-extrabold border-blue-500 uppercase tracking-wider flex items-center gap-1 shadow-sm px-2.5">
                      <span>Copiar Restante</span>
                      <kbd className="px-1 rounded bg-white/20 text-[9px] font-semibold">F8</kbd>
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="cashNio" className="text-[11px] font-bold">
                        Córdobas (C$)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-xs font-black text-slate-500">
                          C$
                        </span>
                        <Input
                          ref={cashNioRef}
                          id="cashNio"
                          type="number"
                          step="any"
                          value={multipleCashNio}
                          onChange={(e) => setMultipleCashNio(e.target.value)}
                          placeholder="0.00"
                          className="pl-8 h-8 text-sm font-bold border-slate-400 bg-background"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="cashUsd" className="text-[11px] font-bold">
                        Dólares ($)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-xs font-black text-slate-500">
                          $
                        </span>
                        <Input
                          id="cashUsd"
                          type="number"
                          step="any"
                          value={multipleCashUsd}
                          onChange={(e) => setMultipleCashUsd(e.target.value)}
                          placeholder="0.00"
                          className="pl-8 h-8 text-sm font-bold border-slate-400 bg-background"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TRANSFERENCIA TAB */}
              {paymentMethod === 'TRANSFER' && (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider flex items-center gap-1.5">
                      <ArrowRightLeft className="w-4 h-4" />
                      <span>Pago por Transferencia</span>
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleFillExactTransfer}
                      className="h-6 text-[10px] bg-blue-650 hover:bg-blue-700 text-white font-extrabold border-blue-500 uppercase tracking-wider flex items-center gap-1 shadow-sm px-2.5">
                      <span>Copiar Restante</span>
                      <kbd className="px-1 rounded bg-white/20 text-[9px] font-semibold">F8</kbd>
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-1">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="transBank" className="text-[11px] font-bold">
                        Banco
                      </Label>
                      <select
                        ref={transBankRef}
                        id="transBank"
                        value={multipleTransferBank}
                        onChange={(e) => setMultipleTransferBank(e.target.value)}
                        className="h-8 text-xs rounded-md border border-slate-400 bg-background px-2 font-bold text-slate-900 dark:text-white"
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
                      <Label htmlFor="transRef" className="text-[11px] font-bold">
                        Referencia
                      </Label>
                      <Input
                        id="transRef"
                        type="text"
                        placeholder="Nº Referencia"
                        value={multipleTransferRef}
                        onChange={(e) => setMultipleTransferRef(e.target.value)}
                        className="h-8 text-sm font-bold border-slate-400 bg-background"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="transAmt" className="text-[11px] font-bold">
                      Monto Transferencia (C$)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-xs font-black text-slate-500">
                        C$
                      </span>
                      <Input
                        ref={transAmtRef}
                        id="transAmt"
                        type="number"
                        step="any"
                        value={multipleTransferAmount}
                        onChange={(e) => setMultipleTransferAmount(e.target.value)}
                        placeholder="0.00"
                        className="pl-8 h-8 text-sm font-bold border-slate-400 bg-background"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TARJETA TAB */}
              {paymentMethod === 'CARD' && (
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-xs font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" />
                      <span>Pago con Tarjeta</span>
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleFillExactCard}
                      className="h-6 text-[10px] bg-blue-650 hover:bg-blue-700 text-white font-extrabold border-blue-500 uppercase tracking-wider flex items-center gap-1 shadow-sm px-2.5">
                      <span>Copiar Restante</span>
                      <kbd className="px-1 rounded bg-white/20 text-[9px] font-semibold">F8</kbd>
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-1">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="cardBrand" className="text-[11px] font-bold">
                        Franquicia
                      </Label>
                      <select
                        ref={cardBrandRef}
                        id="cardBrand"
                        value={multipleCardBrand}
                        onChange={(e) => setMultipleCardBrand(e.target.value)}
                        className="h-8 text-[11px] rounded-md border border-slate-400 bg-background px-1 font-bold text-slate-900 dark:text-white"
                        disabled={isSubmitting}>
                        <option value="Visa">Visa</option>
                        <option value="Mastercard">Mastercard</option>
                        <option value="AMEX">AMEX</option>
                        <option value="BAC">BAC</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="cardDigits" className="text-[11px] font-bold">
                        Últimos 4
                      </Label>
                      <Input
                        id="cardDigits"
                        type="text"
                        maxLength={4}
                        placeholder="0000"
                        value={multipleCardDigits}
                        onChange={(e) => setMultipleCardDigits(e.target.value.replace(/\D/g, ''))}
                        className="pl-2 h-8 text-sm font-bold border-slate-400 bg-background"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="cardRef" className="text-[11px] font-bold">
                        Voucher
                      </Label>
                      <Input
                        id="cardRef"
                        type="text"
                        placeholder="Nº Voucher"
                        value={multipleCardRef}
                        onChange={(e) => setMultipleCardRef(e.target.value)}
                        className="pl-2 h-8 text-sm font-bold border-slate-400 bg-background"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="cardAmt" className="text-[11px] font-bold">
                      Monto Tarjeta (C$)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-xs font-black text-slate-500">
                        C$
                      </span>
                      <Input
                        ref={cardAmtRef}
                        id="cardAmt"
                        type="number"
                        step="any"
                        value={multipleCardAmount}
                        onChange={(e) => setMultipleCardAmount(e.target.value)}
                        placeholder="0.00"
                        className="pl-8 h-8 text-sm font-bold border-slate-400 bg-background"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SUMMARY AND SIDE PANEL */}
          <div className="flex flex-col gap-4">
            <div className="border-2 border-slate-350 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-950/20 flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                Resumen del Abono
              </h3>

              {/* OVERPAYMENT ALERT */}
              {isOverpaid && (
                <div className="p-3 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-900 rounded-md flex gap-2 items-start text-xs font-bold animate-bounce">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    El monto excede el saldo pendiente (C$ {selectedCredit.debt.toFixed(2)})
                  </span>
                </div>
              )}

              {/* CALCULATED BALANCES */}
              <div className="flex flex-col gap-2.5 pt-1.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-600 dark:text-slate-400">Total a Abonar:</span>
                  <span className="text-base font-black text-blue-600 dark:text-blue-400">
                    {currencyFormatter({ currency: 'NIO', value: totalPaidInNio })}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Deuda Restante:
                  </span>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {currencyFormatter({
                      currency: 'NIO',
                      value: Math.max(selectedCredit.debt - totalPaidInNio, 0)
                    })}
                  </span>
                </div>
              </div>

              {/* NOTES */}
              <div className="flex flex-col gap-1.5 pt-2">
                <Label htmlFor="notes" className="text-xs font-bold">
                  Notas / Detalles
                </Label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles adicionales del abono..."
                  rows={2}
                  className="w-full text-xs p-2 rounded border border-slate-350 dark:border-slate-800 bg-background text-slate-900 dark:text-white focus:outline-none"
                  disabled={isSubmitting}
                />
              </div>

              {/* CONFIRM / CANCEL BUTTONS */}
              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={handleSubmitPayment}
                  disabled={!canSubmit() || isSubmitting}
                  className="w-full font-black uppercase text-xs tracking-wider bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-1.5 py-5">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Aplicar Abono</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelPayment}
                  disabled={isSubmitting}
                  className="w-full font-bold text-xs uppercase border-slate-350 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-350 py-4">
                  Cancelar [Esc]
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
