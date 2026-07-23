import { AlertTriangle, LogOut, Coins, CloudOff } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { userLogout } from '@/modules/auth/slices/userSlice';
import { useNavigate } from 'react-router';

interface Props {
  message?: string;
  /** Oculta el overlay para dejar pasar al cajero a cuadrar la caja. */
  onDismiss?: () => void;
}

export function LicenseExpiredOverlay({ message, onDismiss }: Props) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Ventas offline aún sin enviar (pendientes + con error). El logout NO las
  // borra (viven en IndexedDB, no en localStorage) y se sincronizan solas al
  // renovar, pero hay que avisar para que nadie limpie el navegador.
  const unsyncedOffline = useAppSelector(
    (s) => s.offlineSlice.pendingCount + s.offlineSlice.errorCount
  );

  // Turno de caja abierto en este dispositivo: se puede cerrar aunque la
  // licencia esté vencida (el backend exime el cierre) para cuadrar la gaveta.
  const hasOpenCash =
    typeof window !== 'undefined' && !!localStorage.getItem('active_cash_session_id');

  const handleLogout = () => {
    if (unsyncedOffline > 0) {
      const confirmed = window.confirm(
        `Tienes ${unsyncedOffline} venta(s) offline sin sincronizar. Se guardan en este ` +
          `dispositivo y se enviarán solas al renovar la licencia. No borres los datos del ` +
          `navegador. ¿Cerrar sesión de todos modos?`
      );
      if (!confirmed) return;
    }
    dispatch(userLogout());
    navigate('/login');
  };

  const handleCloseCash = () => {
    navigate('/caja');
    onDismiss?.();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-6">
      <div className="w-full max-w-md bg-slate-900 border-2 border-red-900/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col items-center">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="p-4 bg-red-950/40 rounded-full border border-red-800/40 mb-6 shadow-lg shadow-red-900/20">
          <AlertTriangle size={42} className="text-red-500" />
        </div>

        <h2 className="text-white text-xl font-black tracking-tight uppercase text-center mb-2">
          Licencia Expirada
        </h2>

        <p className="text-slate-400 text-sm font-medium text-center mb-6 leading-relaxed">
          El acceso al sistema se ha suspendido. Pídele al administrador que renueve la licencia
          para seguir facturando.
        </p>

        {message && (
          <div className="w-full bg-red-950/30 border border-red-900/50 rounded-xl p-4 mb-4">
            <p className="text-red-200 text-sm text-center font-medium leading-relaxed">
              {message}
            </p>
          </div>
        )}

        {unsyncedOffline > 0 && (
          <div className="w-full bg-amber-950/30 border border-amber-800/50 rounded-xl p-4 mb-4 flex items-start gap-2.5">
            <CloudOff size={18} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-amber-200/90 text-xs font-medium leading-relaxed text-left">
              Tienes <b className="text-amber-100">{unsyncedOffline}</b> venta(s) offline sin
              sincronizar. Están guardadas en este dispositivo y se enviarán solas al renovar la
              licencia. No borres los datos del navegador ni desinstales la app.
            </p>
          </div>
        )}

        <div className="w-full flex flex-col gap-2.5 mt-2">
          {hasOpenCash && (
            <button
              onClick={handleCloseCash}
              className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-lg transition-colors"
            >
              <Coins size={18} />
              <span className="text-sm font-bold uppercase tracking-wider">
                Cerrar caja para cuadrar la gaveta
              </span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 active:bg-slate-600 rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm font-bold uppercase tracking-wider">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
}
