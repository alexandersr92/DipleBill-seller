import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addCashTransaction,
  closeCashSession,
  fetchCashSettingsAndSession,
  ICashSession,
  updateCashTransaction,
  deleteCashTransaction
} from '../slices/cashSlice';
import { useToast } from '@/components/hooks/use-toast';
import {
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Pencil,
  Trash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { currencyFormatter } from '../helpers';
import { getExpenseCategoriesApi, createExpenseCategoryApi } from '../services/expenseCategoryService';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { CaretSortIcon } from '@radix-ui/react-icons';

export default function CashControlContainer() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const { store } = useAppSelector((state) => state.storeSlice);
  const storeId = store?.id || '';

  const { activeSession, isOpen, totals, countType, isLoading } = useAppSelector(
    (state) => state.cashSlice
  );

  const sellerName =
    useAppSelector((state) => state.userSlice.sellerName) ||
    localStorage.getItem('seller_name') ||
    'Cajero';

  // Manual transaction states
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<'in' | 'out'>('out');
  const [txAmount, setTxAmount] = useState('');
  const [txCurrency, setTxCurrency] = useState<'NIO' | 'USD'>('NIO');
  const [txCategoryId, setTxCategoryId] = useState<string | null>(null);
  const [txDescription, setTxDescription] = useState('');
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);
  const [editingTx, setEditingTx] = useState<any | null>(null);
  const [expenseCategories, setExpenseCategories] = useState<{ id: string; name: string }[]>([]);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');

  // Close session states
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [actualCash, setActualCash] = useState('');
  const [actualUsd, setActualUsd] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);
  const exchangeRate = parseFloat(localStorage.getItem('usd_exchange_rate') || '0');

  const handleEditTxClick = (tx: any) => {
    setEditingTx(tx);
    setTxType(tx.type);
    setTxAmount(tx.amount.toString());
    setTxCurrency(tx.currency || 'NIO');
    setTxCategoryId(tx.expense_category_id || null);
    setTxDescription(tx.description || '');
    setShowTxModal(true);
  };

  const handleDeleteTxClick = async (txId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este movimiento de ajuste?')) return;
    try {
      await dispatch(
        deleteCashTransaction({
          id: txId,
          storeId
        })
      ).unwrap();
      toast({
        title: 'Movimiento Eliminado',
        description: 'Se eliminó el movimiento de ajuste correctamente.',
        className: 'bg-green-600 border-green-500 text-white'
      });
    } catch (err: any) {
      toast({
        title: 'Error al eliminar',
        description: err || 'Ocurrió un error en el servidor.',
        variant: 'destructive'
      });
    }
  };

  // Load state on mount
  useEffect(() => {
    if (storeId) {
      dispatch(fetchCashSettingsAndSession(storeId));
    }
    
    // Fetch categories
    getExpenseCategoriesApi().then((res) => {
      setExpenseCategories(res.data || []);
    }).catch(err => {
      console.error('Error fetching categories:', err);
    });
  }, [storeId, dispatch]);

  const handleOpenTxModal = () => {
    setEditingTx(null);
    setTxType('out');
    setTxAmount('');
    setTxCurrency('NIO');
    setTxCategoryId(null);
    setTxDescription('');
    setShowTxModal(true);
  };

  const handleAddTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !storeId) return;

    const amt = parseFloat(txAmount);
    if (isNaN(amt) || amt <= 0) {
      toast({
        title: 'Monto inválido',
        description: 'El monto ingresado debe ser mayor a 0.',
        variant: 'destructive'
      });
      return;
    }

    if (!txDescription.trim()) {
      toast({
        title: 'Descripción requerida',
        description: 'Debes ingresar el motivo del movimiento.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmittingTx(true);
    try {
      if (editingTx) {
        await dispatch(
          updateCashTransaction({
            id: editingTx.id,
            type: txType,
            amount: amt,
            currency: txCurrency,
            expense_category_id: txType === 'out' ? txCategoryId : null,
            description: txDescription.trim(),
            storeId
          })
        ).unwrap();

        toast({
          title: 'Movimiento Actualizado',
          description: 'Se modificó el movimiento de ajuste correctamente.',
          className: 'bg-green-600 border-green-500 text-white'
        });
      } else {
        await dispatch(
          addCashTransaction({
            cashSessionId: activeSession.id,
            type: txType,
            amount: amt,
            currency: txCurrency,
            expense_category_id: txType === 'out' ? txCategoryId : null,
            description: txDescription.trim(),
            storeId
          })
        ).unwrap();

        toast({
          title: 'Movimiento Registrado',
          description: `Se registró un ${txType === 'in' ? 'ingreso' : 'egreso'} de ${txCurrency} ${amt.toFixed(2)}.`,
          className: 'bg-green-600 border-green-500 text-white'
        });
      }
      setShowTxModal(false);
    } catch (err: any) {
      toast({
        title: editingTx ? 'Error al actualizar' : 'Error al registrar',
        description: err || 'Ocurrió un error en el servidor.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmittingTx(false);
    }
  };

  const handleOpenCloseModal = () => {
    setActualCash('');
    setActualUsd('');
    setCloseNotes('');
    setShowCloseModal(true);
  };

  const handleCloseSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !storeId || !totals) return;

    const cashVal = parseFloat(actualCash);
    if (isNaN(cashVal) || cashVal < 0) {
      toast({
        title: 'Monto inválido',
        description: 'Introduce una cantidad válida de efectivo.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmittingClose(true);
    try {
      const usdVal = parseFloat(actualUsd) || 0;
      await dispatch(
        closeCashSession({
          cashSessionId: activeSession.id,
          actualCash: cashVal,
          actualUsd: usdVal,
          usdExchangeRate: exchangeRate > 0 ? exchangeRate : undefined,
          notes: closeNotes.trim() || undefined,
          storeId
        })
      ).unwrap();

      toast({
        title: 'Caja Cerrada y Turno Terminado',
        description: `El arqueo finalizó correctamente.`,
        className: 'bg-green-600 border-green-500 text-white'
      });

      // Imprimir el ticket de cierre térmico
      handlePrintClosureTicket(activeSession, totals, cashVal, usdVal, closeNotes);

      setShowCloseModal(false);
    } catch (err: any) {
      toast({
        title: 'Error al cerrar caja',
        description: err || 'Ocurrió un error en el servidor.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmittingClose(false);
    }
  };

  const handlePrintClosureTicket = (
    session: ICashSession,
    tot: any,
    reportedCash: number,
    reportedUsd: number,
    notesText: string
  ) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const expectedCashNio = tot?.expected_cash_nio ?? tot?.expected_cash ?? 0;
    const expectedCashUsd = tot?.expected_cash_usd ?? 0;
    const rate = session.usd_exchange_rate || parseFloat(localStorage.getItem('usd_exchange_rate') || '36.5') || 36.5;

    const diffNio = reportedCash - expectedCashNio;
    const diffNioText =
      diffNio === 0
        ? 'CUADRADO'
        : diffNio > 0
          ? `SOBRANTE (+C$ ${diffNio.toFixed(2)})`
          : `FALTANTE (-C$ ${Math.abs(diffNio).toFixed(2)})`;

    const diffUsd = reportedUsd - expectedCashUsd;
    const diffUsdText =
      diffUsd === 0
        ? 'CUADRADO'
        : diffUsd > 0
          ? `SOBRANTE (+$ ${diffUsd.toFixed(2)})`
          : `FALTANTE (-$ ${Math.abs(diffUsd).toFixed(2)})`;

    const totalExpectedNio = expectedCashNio + (expectedCashUsd * rate);
    const totalReportedNio = reportedCash + (reportedUsd * rate);
    const totalDiffNio = totalReportedNio - totalExpectedNio;
    const totalDiffText =
      totalDiffNio === 0
        ? 'CUADRADO'
        : totalDiffNio > 0
          ? `SOBRANTE (+C$ ${totalDiffNio.toFixed(2)})`
          : `FALTANTE (-C$ ${Math.abs(totalDiffNio).toFixed(2)})`;

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: monospace; font-size: 11px; margin: 10px; width: 280px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .hr { border-top: 1px dashed #000; margin: 10px 0; }
            table { width: 100%; }
            .right { text-align: right; }
            .title { font-size: 13px; }
          </style>
        </head>
        <body>
          <div class="center bold title">${store?.name || 'DipleBill POS'}</div>
          <div class="center">${store?.address || ''}</div>
          <div class="hr"></div>
          <div class="center bold">ARQUEO Y CIERRE DE CAJA</div>
          <div class="hr"></div>
          <table>
            <tr><td>Caja:</td><td class="right">${session.cash_register_name || 'General'}</td></tr>
            <tr><td>Cajero:</td><td class="right">${sellerName}</td></tr>
            <tr><td>Apertura:</td><td class="right">${new Date(session.opened_at).toLocaleString()}</td></tr>
            <tr><td>Cierre:</td><td class="right">${new Date().toLocaleString()}</td></tr>
          </table>
          
          <div class="hr"></div>
          <div class="bold">1. RESUMEN GAVETA EFECTIVO (C$)</div>
          <div class="hr"></div>
          <table>
            <tr><td>(+) Fondo Inicial:</td><td class="right">C$ ${session.opening_balance.toFixed(2)}</td></tr>
            <tr><td>(+) Ventas Efectivo C$:</td><td class="right">C$ ${(tot.invoice_cash_nio ?? tot.invoice_cash ?? 0).toFixed(2)}</td></tr>
            <tr><td>(+) Abonos Crédito C$:</td><td class="right">C$ ${(tot.credit_cash_nio ?? tot.credit_cash ?? 0).toFixed(2)}</td></tr>
            <tr><td>(+) Ingresos Manuales C$:</td><td class="right">C$ ${(tot.manual_in_nio ?? tot.manual_in ?? 0).toFixed(2)}</td></tr>
            <tr><td>(-) Egresos Manuales C$:</td><td class="right">C$ ${(tot.manual_out_nio ?? tot.manual_out ?? 0).toFixed(2)}</td></tr>
          </table>
          <div class="hr"></div>
          <table>
            <tr class="bold"><td>Esperado Córdoba:</td><td class="right">C$ ${expectedCashNio.toFixed(2)}</td></tr>
            <tr class="bold"><td>Reportado Córdoba:</td><td class="right">C$ ${reportedCash.toFixed(2)}</td></tr>
            <tr class="bold"><td>Diferencia Córdoba:</td><td class="right">${diffNioText}</td></tr>
          </table>

          <div class="hr"></div>
          <div class="bold">2. RESUMEN GAVETA EFECTIVO (USD)</div>
          <div class="hr"></div>
          <table>
            <tr><td>(+) Ventas Efectivo USD:</td><td class="right">$ ${(tot.invoice_cash_usd ?? 0).toFixed(2)}</td></tr>
            <tr><td>(+) Abonos Crédito USD:</td><td class="right">$ ${(tot.credit_cash_usd ?? 0).toFixed(2)}</td></tr>
            <tr><td>(+) Ingresos Manuales USD:</td><td class="right">$ ${(tot.manual_in_usd ?? 0).toFixed(2)}</td></tr>
            <tr><td>(-) Egresos Manuales USD:</td><td class="right">$ ${(tot.manual_out_usd ?? 0).toFixed(2)}</td></tr>
          </table>
          <div class="hr"></div>
          <table>
            <tr class="bold"><td>Esperado Dólar:</td><td class="right">$ ${expectedCashUsd.toFixed(2)}</td></tr>
            <tr class="bold"><td>Reportado Dólar:</td><td class="right">$ ${reportedUsd.toFixed(2)}</td></tr>
            <tr class="bold"><td>Diferencia Dólar:</td><td class="right">${diffUsdText}</td></tr>
          </table>

          <div class="hr"></div>
          <div class="bold">3. RESUMEN UNIFICADO Y AUDITORÍA</div>
          <div class="hr"></div>
          <table>
            <tr><td>Tasa de Cambio:</td><td class="right">C$ ${rate.toFixed(4)}</td></tr>
            <tr class="bold"><td>Diferencia Total (NIO):</td><td class="right">${totalDiffText}</td></tr>
          </table>

          <div class="hr"></div>
          <div class="bold">4. VENTAS ELECTRÓNICAS (AUDITORÍA)</div>
          <div class="hr"></div>
          <table>
            <tr><td>Ventas Transferencia:</td><td class="right">C$ ${tot.invoice_transfer.toFixed(2)}</td></tr>
            <tr><td>Ventas Tarjeta:</td><td class="right">C$ ${tot.invoice_card.toFixed(2)}</td></tr>
            <tr><td>Abonos Transferencia:</td><td class="right">C$ ${tot.credit_transfer.toFixed(2)}</td></tr>
            <tr><td>Abonos Tarjeta:</td><td class="right">C$ ${tot.credit_card.toFixed(2)}</td></tr>
          </table>
          <div class="hr"></div>
          <table>
            <tr class="bold"><td>Total Transferencia:</td><td class="right">C$ ${tot.total_transfer.toFixed(2)}</td></tr>
            <tr class="bold"><td>Total Tarjeta:</td><td class="right">C$ ${tot.total_card.toFixed(2)}</td></tr>
          </table>

          ${
            notesText
              ? `
            <div class="hr"></div>
            <div>Notas del Turno:</div>
            <div>${notesText}</div>
          `
              : ''
          }
          <div class="hr"></div>
          <div class="center bold" style="margin-top: 30px;">Firma del Cajero</div>
          <div style="margin-top: 40px; border-top: 1px solid #000; width: 70%; margin-left: auto; margin-right: auto;"></div>
          <div class="center" style="margin-top: 20px;">Sesión cerrada en el sistema.</div>
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

  if (isLoading && !activeSession) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-4 p-2 max-w-5xl mx-auto w-full select-none">
      <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-blue-600 dark:text-blue-400 stroke-[2.5px]" />
            Control de Caja y Turnos
          </h1>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Gestiona aperturas, egresos de efectivo y arqueos diarios de caja
          </p>
        </div>
        {isOpen && activeSession && (
          <div className="flex gap-2">
            <Button
              onClick={handleOpenTxModal}
              className="h-8 text-xs font-extrabold uppercase bg-slate-200 hover:bg-slate-350 text-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 flex items-center gap-1">
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Registrar Ajuste / Gasto</span>
            </Button>
            <Button
              onClick={handleOpenCloseModal}
              className="h-8 text-xs font-extrabold uppercase bg-red-600 hover:bg-red-700 text-white flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Cerrar Turno</span>
            </Button>
          </div>
        )}
      </div>

      {!isOpen || !activeSession ? (
        <div className="border border-dashed border-slate-300 dark:border-slate-800 rounded-lg p-12 text-center flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/10">
          <AlertCircle className="w-10 h-10 text-slate-400 mb-3" />
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">
            Caja Cerrada
          </h3>
          <p className="text-xs text-slate-500 max-w-md">
            No hay turnos activos registrados para tu usuario en esta sucursal. Abre la caja
            ingresando un fondo inicial para facturar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in-50 duration-200">
          {/* STATS OVERVIEW */}
          <div className="md:col-span-2 flex flex-col gap-4">
            {/* CASH IN DRAWER PROMINENT CARD */}
            <div className="border-2 border-slate-350 dark:border-slate-800 rounded-xl p-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white relative overflow-hidden shadow-md flex items-center justify-between">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] bg-blue-600/30 text-blue-400 font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase border border-blue-500/20">
                    Caja Abierta
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Desde:{' '}
                    {new Date(activeSession.opened_at).toLocaleTimeString()}
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Efectivo Esperado en Gaveta
                </h3>
                <div className="flex flex-col md:flex-row md:items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-white tracking-tight">
                    {currencyFormatter({ currency: 'NIO', value: totals?.expected_cash_nio ?? totals?.expected_cash ?? 0 })}
                  </span>
                  {totals?.expected_cash_usd !== undefined && totals.expected_cash_usd > 0 && (
                    <span className="text-xl font-bold text-slate-350">
                      / ${totals.expected_cash_usd.toFixed(2)} USD
                    </span>
                  )}
                </div>
              </div>
              <div className="p-3.5 bg-blue-500/10 rounded-full border border-blue-500/20 text-blue-400">
                <Coins className="w-8 h-8" />
              </div>
            </div>

            {/* BREAKDOWN LIST */}
            <div className="border-2 border-slate-300 dark:border-slate-800 rounded-xl p-4 bg-background flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                Desglose Acumulado del Turno
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
                {/* FONDO INICIAL */}
                <div className="border border-slate-250 dark:border-slate-850 p-3 rounded-lg bg-slate-50/50 dark:bg-slate-900/10">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Fondo Inicial
                  </p>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
                    {currencyFormatter({ currency: 'NIO', value: activeSession.opening_balance })}
                  </p>
                </div>

                {/* VENTAS DIRECTAS EFECTIVO */}
                <div className="border border-slate-250 dark:border-slate-850 p-3 rounded-lg bg-slate-50/50 dark:bg-slate-900/10">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Ventas Directas (Efe)
                  </p>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
                    {currencyFormatter({ currency: 'NIO', value: totals?.invoice_cash_nio ?? totals?.invoice_cash ?? 0 })}
                    {totals?.invoice_cash_usd !== undefined && totals.invoice_cash_usd > 0 && (
                      <span className="text-[11px] font-bold text-slate-500 ml-1">
                        / ${totals.invoice_cash_usd.toFixed(2)}
                      </span>
                    )}
                  </p>
                </div>

                {/* ABONOS CRÉDITO EFECTIVO */}
                <div className="border border-slate-250 dark:border-slate-850 p-3 rounded-lg bg-slate-50/50 dark:bg-slate-900/10">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Abonos Crédito (Efe)
                  </p>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
                    {currencyFormatter({ currency: 'NIO', value: totals?.credit_cash_nio ?? totals?.credit_cash ?? 0 })}
                    {totals?.credit_cash_usd !== undefined && totals.credit_cash_usd > 0 && (
                      <span className="text-[11px] font-bold text-slate-500 ml-1">
                        / ${totals.credit_cash_usd.toFixed(2)}
                      </span>
                    )}
                  </p>
                </div>

                {/* AJUSTES INGRESOS */}
                <div className="border border-slate-250 dark:border-slate-850 p-3 rounded-lg bg-slate-50/50 dark:bg-slate-900/10 flex flex-col justify-between">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3 text-green-500" /> Ingresos Manuales
                  </p>
                  <p className="text-sm font-black text-green-600 mt-1">
                    {currencyFormatter({ currency: 'NIO', value: totals?.manual_in_nio ?? totals?.manual_in ?? 0 })}
                    {totals?.manual_in_usd !== undefined && totals.manual_in_usd > 0 && (
                      <span className="text-[11px] font-bold text-slate-500 ml-1">
                        / ${totals.manual_in_usd.toFixed(2)}
                      </span>
                    )}
                  </p>
                </div>

                {/* AJUSTES EGRESOS */}
                <div className="border border-slate-250 dark:border-slate-850 p-3 rounded-lg bg-slate-50/50 dark:bg-slate-900/10 flex flex-col justify-between">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <ArrowDownRight className="w-3 h-3 text-red-500" /> Egresos/Gastos
                  </p>
                  <p className="text-sm font-black text-red-500 mt-1">
                    {currencyFormatter({ currency: 'NIO', value: totals?.manual_out_nio ?? totals?.manual_out ?? 0 })}
                    {totals?.manual_out_usd !== undefined && totals.manual_out_usd > 0 && (
                      <span className="text-[11px] font-bold text-slate-500 ml-1">
                        / ${totals.manual_out_usd.toFixed(2)}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* SHIFT ADJUSTMENTS LIST */}
            <div className="border-2 border-slate-350 dark:border-slate-800 rounded-xl p-4 bg-background flex flex-col gap-3">
              <h3 className="text-xs font-black uppercase text-slate-850 dark:text-slate-200 tracking-wider">
                Movimientos de Ajuste de este Turno
              </h3>

              {(activeSession.cash_transactions || activeSession.cashTransactions) &&
              ((activeSession.cash_transactions || activeSession.cashTransactions)?.length ?? 0) >
                0 ? (
                <div className="border border-slate-250 dark:border-slate-850 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-250 dark:border-slate-850 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                        <th className="p-2.5">Tipo</th>
                        <th className="p-2.5">Monto</th>
                        <th className="p-2.5">Descripción / Motivo</th>
                        <th className="p-2.5 text-center w-[90px]">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-850">
                      {(activeSession.cash_transactions || activeSession.cashTransactions)?.map(
                        (tx: any) => (
                          <tr
                            key={tx.id}
                            className="hover:bg-slate-55/50 dark:hover:bg-slate-900/10">
                            <td className="p-2.5 font-bold">
                              {tx.type === 'in' ? (
                                <span className="text-green-600 dark:text-green-400">
                                  Entrada (+)
                                </span>
                              ) : (
                                <span className="text-red-500">Salida (-)</span>
                              )}
                            </td>
                            <td className="p-2.5 font-extrabold text-slate-850 dark:text-white">
                              {currencyFormatter({ currency: tx.currency || 'NIO', value: tx.amount })}
                            </td>
                            <td
                              className="p-2.5 text-slate-600 dark:text-slate-400 max-w-[200px] truncate"
                              title={tx.description || ''}>
                              {tx.expense_category_id ? (
                                <span className="font-bold text-xs uppercase bg-slate-200 dark:bg-slate-800 px-1 rounded mr-1">
                                  {expenseCategories.find((c) => c.id === tx.expense_category_id)?.name || 'Categoría'}
                                </span>
                              ) : null}
                              {tx.description || '-'}
                            </td>
                            <td className="p-2.5 text-center">
                              <div className="flex justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditTxClick(tx)}
                                  title="Editar movimiento"
                                  className="h-7 w-7 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-800">
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteTxClick(tx.id)}
                                  title="Eliminar movimiento"
                                  className="h-7 w-7 text-slate-500 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-800">
                                  <Trash className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-slate-500 italic text-xs py-5 border border-dashed border-slate-300 dark:border-slate-850 rounded-lg text-center bg-slate-50/30 dark:bg-slate-900/5">
                  No hay movimientos de ajuste registrados en este turno.
                </div>
              )}
            </div>
          </div>

          {/* ELECTRONIC PAYMENTS AND SHIFT INFO PANEL */}
          <div className="flex flex-col gap-4">
            <div className="border-2 border-slate-350 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-950/20 flex flex-col gap-4 h-full justify-between">
              <div className="flex flex-col gap-3.5">
                <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                  Detalles del Turno
                </h3>

                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between items-center text-slate-500 font-bold">
                    <span>Caja física:</span>
                    <span className="text-slate-850 dark:text-slate-100 font-extrabold">
                      {activeSession.cash_register_name || 'General'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 font-bold">
                    <span>Cajero de turno:</span>
                    <span className="text-slate-850 dark:text-slate-100 font-extrabold">
                      {sellerName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 font-bold">
                    <span>Apertura:</span>
                    <span className="text-slate-850 dark:text-slate-100 font-extrabold">
                      {new Date(activeSession.opened_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-3.5 border-t border-slate-250 dark:border-slate-850">
                <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                  Pagos Electrónicos (Auditoría)
                </h3>

                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between items-center text-slate-500 font-bold">
                    <span>Transf. Bancarias:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-extrabold">
                      {currencyFormatter({ currency: 'NIO', value: totals?.total_transfer || 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 font-bold">
                    <span>Venta con Tarjeta:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-extrabold">
                      {currencyFormatter({ currency: 'NIO', value: totals?.total_card || 0 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL TRANSACTION DIALOG */}
      {showTxModal && activeSession && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-slate-800 rounded-xl p-5 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <PlusCircle className="w-4 h-4 text-blue-500" />
              <span>{editingTx ? 'Editar Movimiento' : 'Registrar Ajuste / Gasto'}</span>
            </h2>

            <form onSubmit={handleAddTransactionSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold text-slate-350">Tipo de Ajuste</Label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 border border-slate-750 rounded-md">
                  <button
                    type="button"
                    onClick={() => setTxType('out')}
                    className={cn(
                      'py-1.5 text-xs font-bold rounded transition-all',
                      txType === 'out'
                        ? 'bg-red-650 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    )}>
                    Egreso (Gasto)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('in')}
                    className={cn(
                      'py-1.5 text-xs font-bold rounded transition-all',
                      txType === 'in'
                        ? 'bg-green-650 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    )}>
                    Ingreso (Cambio)
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="txAmount" className="text-xs font-bold text-slate-350">
                  Monto y Moneda
                </Label>
                <div className="flex gap-2">
                  <select
                    value={txCurrency}
                    onChange={(e) => setTxCurrency(e.target.value as 'NIO' | 'USD')}
                    className="h-8 text-xs font-bold border border-slate-700 bg-slate-950 text-white rounded px-2 w-24">
                    <option value="NIO">NIO (C$)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1.5 text-xs font-black text-slate-500">
                      {txCurrency === 'NIO' ? 'C$' : '$'}
                    </span>
                    <Input
                      id="txAmount"
                      type="number"
                      step="any"
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      placeholder="0.00"
                      className="pl-8 h-8 text-sm font-bold border-slate-700 bg-slate-950 text-white animate-in"
                    />
                  </div>
                </div>
              </div>

              {txType === 'out' && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-bold text-slate-350">Categoría de Gasto</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          'w-full justify-between h-8 text-xs border-slate-700 bg-slate-950 text-white',
                          !txCategoryId && 'text-slate-400'
                        )}
                      >
                        {txCategoryId
                          ? expenseCategories.find((c) => c.id === txCategoryId)?.name
                          : 'Seleccionar categoría...'}
                        <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Buscar o crear..."
                          className="h-8 text-xs"
                          value={categorySearchTerm}
                          onValueChange={setCategorySearchTerm}
                        />
                        <CommandList>
                          <CommandEmpty>
                            <Button
                              variant="ghost"
                              className="w-full justify-start text-xs h-8"
                              onClick={async () => {
                                if (categorySearchTerm) {
                                  try {
                                    const newCategory = await createExpenseCategoryApi(categorySearchTerm);
                                    setExpenseCategories([...expenseCategories, newCategory]);
                                    setTxCategoryId(newCategory.id);
                                    setCategorySearchTerm('');
                                    toast({ title: 'Categoría creada', variant: 'success' });
                                  } catch (error) {
                                    toast({ title: 'Error al crear la categoría', variant: 'destructive' });
                                  }
                                }
                              }}
                            >
                              + Crear &quot;{categorySearchTerm}&quot;
                            </Button>
                          </CommandEmpty>
                          <CommandGroup>
                            {expenseCategories.map((category) => (
                              <CommandItem
                                key={category.id}
                                onSelect={() => setTxCategoryId(category.id)}
                                className="text-xs"
                              >
                                <div className="flex items-center">
                                  <Checkbox
                                    checked={txCategoryId === category.id}
                                    className="mr-2"
                                  />
                                  {category.name}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="txDesc" className="text-xs font-bold text-slate-350">
                  Descripción / Motivo
                </Label>
                <Input
                  id="txDesc"
                  type="text"
                  placeholder="Ej: Pago de hielo, entrada de sencillo"
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  className="h-8 text-xs font-bold border-slate-700 bg-slate-950 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => setShowTxModal(false)}
                  variant="outline"
                  className="h-8 text-xs font-bold uppercase border-slate-700 hover:bg-slate-800 text-slate-300">
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingTx}
                  className="h-8 text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-750 text-white">
                  {isSubmittingTx ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>{editingTx ? 'Actualizar' : 'Guardar'}</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLOSURE / ARQUEO DIALOG */}
      {showCloseModal && activeSession && totals && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-slate-800 rounded-xl p-5 shadow-2xl relative animate-in zoom-in-95 duration-150">
            <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-red-500 animate-pulse" />
              <span>Arqueo y Cierre de Caja</span>
            </h2>

            <form onSubmit={handleCloseSessionSubmit} className="flex flex-col gap-4">
              {/* GUIDED MODE INFO */}
              {countType === 'GUIDED' && (
                <div className="border border-blue-900/50 rounded bg-blue-950/20 p-2.5 flex flex-col gap-0.5 text-xs text-slate-300 font-bold">
                  <span className="text-[10px] text-slate-500 uppercase">Efectivo Esperado</span>
                  <span className="text-sm font-extrabold text-blue-400">
                    {currencyFormatter({ currency: 'NIO', value: totals.expected_cash })}
                  </span>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="actualCash" className="text-xs font-bold text-slate-350">
                  Efectivo Real Contado en Gaveta (C$)
                </Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs font-black text-slate-500">
                    C$
                  </span>
                  <Input
                    id="actualCash"
                    type="number"
                    step="any"
                    value={actualCash}
                    onChange={(e) => setActualCash(e.target.value)}
                    placeholder="0.00"
                    className="pl-8 h-8 text-sm font-bold border-slate-700 bg-slate-950 text-white"
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="actualUsd" className="text-xs font-bold text-slate-350">
                    Dólares Físicos en Gaveta (USD)
                  </Label>
                  <span className="text-[10px] text-slate-500">TC: {exchangeRate > 0 ? exchangeRate : 'No configurada'}</span>
                </div>
                <div className="relative">
                  <span className="absolute left-2.5 top-1.5 text-xs font-black text-slate-500">
                    $
                  </span>
                  <Input
                    id="actualUsd"
                    type="number"
                    step="any"
                    value={actualUsd}
                    onChange={(e) => setActualUsd(e.target.value)}
                    placeholder="0.00"
                    className="pl-8 h-8 text-sm font-bold border-slate-700 bg-slate-950 text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="closeNotes" className="text-xs font-bold text-slate-350">
                  Notas / Observaciones del Cierre
                </Label>
                <textarea
                  id="closeNotes"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Detalles sobre faltantes, sobrantes o incidencias..."
                  rows={2}
                  className="w-full text-xs p-2 rounded border border-slate-750 bg-slate-950 text-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  variant="outline"
                  className="h-8 text-xs font-bold uppercase border-slate-700 hover:bg-slate-800 text-slate-300">
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingClose}
                  className="h-8 text-xs font-black uppercase tracking-wider bg-red-600 hover:bg-red-750 text-white">
                  {isSubmittingClose ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Cerrar Turno</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
