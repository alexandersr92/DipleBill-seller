import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { openCashSession } from '../slices/cashSlice';
import { useToast } from '@/components/hooks/use-toast';
import { Coins, LogOut, Loader2, Store, Lock, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { sellerLogout } from '@/modules/auth/slices/userSlice';
import { useOnlineStatus } from '@/modules/offline/hooks/useOnlineStatus';
import { OfflineBlockedScreen } from '@/modules/offline/components/OfflineBlockedScreen';

export function CashSessionOverlay() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const isOnline = useOnlineStatus();

  const { store } = useAppSelector((state) => state.storeSlice);
  const sellerName =
    useAppSelector((state) => state.userSlice.sellerName) ||
    localStorage.getItem('seller_name') ||
    'Vendedor';

  const [openingBalance, setOpeningBalance] = useState<string>('0.00');
  const [cashRegisterName, setCashRegisterName] = useState<string>('');
  const [isOpening, setIsOpening] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const balanceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    balanceRef.current?.focus();
    balanceRef.current?.select();
  }, []);

  const handleOpen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!store?.id) return;

    const balanceVal = parseFloat(openingBalance);
    if (isNaN(balanceVal) || balanceVal < 0) {
      setError('El fondo inicial de apertura debe ser un número mayor o igual a 0.');
      return;
    }

    setIsOpening(true);
    setError(null);

    try {
      await dispatch(
        openCashSession({
          storeId: store.id,
          openingBalance: balanceVal,
          cashRegisterName: cashRegisterName.trim() || undefined
        })
      ).unwrap();

      toast({
        title: 'Caja Abierta',
        description: `Se inició el turno con un fondo de C$ ${balanceVal.toFixed(2)}.`,
        className: 'bg-green-600 border-green-500 text-white'
      });
    } catch (err: any) {
      setError(err || 'No se pudo abrir la sesión de caja.');
    } finally {
      setIsOpening(false);
    }
  };

  const handleLogoutSeller = () => {
    localStorage.removeItem('seller_id');
    localStorage.removeItem('seller_name');
    localStorage.removeItem('seller_code');
    dispatch(sellerLogout());
  };

  // Sin conexión no se abre caja (la apertura registra el turno en el servidor):
  // solo se factura offline si la caja ya estaba abierta antes del corte.
  if (!isOnline) {
    return (
      <OfflineBlockedScreen message="Sin conexión y sin una caja abierta previamente. Se requiere internet para abrir el turno de caja." />
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md flex items-center justify-center z-[9999] select-none p-4">
      <div className="w-full max-w-md bg-slate-900 border-2 border-slate-800 rounded-xl p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex flex-col items-center text-center gap-2 mb-6">
          <div className="p-3 bg-blue-950/40 rounded-full border border-blue-800 text-blue-500 mb-1">
            <Coins className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-lg font-black tracking-tight text-white uppercase">
            Apertura de Caja
          </h1>
          <p className="text-xs font-semibold text-slate-400">
            Se requiere registrar el fondo inicial para iniciar la facturación
          </p>
        </div>

        {/* Info panel */}
        <div className="border border-slate-850 rounded-lg p-3 bg-slate-950/40 mb-5 flex flex-col gap-1.5 text-xs">
          <div className="flex justify-between items-center text-slate-400 font-bold">
            <span className="flex items-center gap-1">
              <Store className="w-3.5 h-3.5" /> Sucursal:
            </span>
            <span className="text-white truncate max-w-[200px]">
              {store?.name || 'Cargando...'}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-400 font-bold">
            <span className="flex items-center gap-1">
              <Key className="w-3.5 h-3.5" /> Cajero/Vendedor:
            </span>
            <span className="text-white">{sellerName}</span>
          </div>
        </div>

        <form onSubmit={handleOpen} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="openingBalance" className="text-xs font-bold text-slate-350">
              Fondo Inicial de Apertura (C$)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm font-black text-slate-500">C$</span>
              <Input
                ref={balanceRef}
                id="openingBalance"
                type="number"
                step="any"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="0.00"
                className="pl-9 h-10 text-base font-black border-slate-700 bg-slate-950 text-white"
                disabled={isOpening}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="registerName" className="text-xs font-bold text-slate-350">
              Nombre/Número de Caja (Opcional)
            </Label>
            <Input
              id="registerName"
              type="text"
              placeholder="Ej: Caja Principal, Caja Estación 2"
              value={cashRegisterName}
              onChange={(e) => setCashRegisterName(e.target.value)}
              className="h-9 text-xs font-bold border-slate-700 bg-slate-950 text-white"
              disabled={isOpening}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-950/40 text-red-400 border border-red-900 rounded-md flex gap-2 items-start text-xs font-bold animate-shake">
              <Lock className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-2.5 pt-2">
            <Button
              type="submit"
              disabled={isOpening}
              className="w-full font-black uppercase text-xs tracking-wider bg-blue-600 hover:bg-blue-750 text-white py-5 shadow-lg shadow-blue-500/10">
              {isOpening ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  <span>Iniciando turno...</span>
                </>
              ) : (
                <span>Abrir Caja e Iniciar</span>
              )}
            </Button>

            <button
              type="button"
              onClick={handleLogoutSeller}
              className="text-xs font-bold text-slate-500 hover:text-slate-350 hover:underline flex items-center justify-center gap-1 py-2"
              disabled={isOpening}>
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión del Vendedor</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
