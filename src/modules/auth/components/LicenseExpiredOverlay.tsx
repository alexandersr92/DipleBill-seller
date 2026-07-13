import { AlertTriangle, LogOut } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { userLogout } from '@/store/store';
import { useNavigate } from 'react-router';

interface Props {
  message?: string;
}

export function LicenseExpiredOverlay({ message }: Props) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(userLogout());
    navigate('/login');
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
          El tiempo de uso de tu licencia ha concluido y el acceso al sistema ha sido suspendido.
        </p>

        {message && (
          <div className="w-full bg-red-950/30 border border-red-900/50 rounded-xl p-4 mb-8">
            <p className="text-red-200 text-sm text-center font-medium leading-relaxed">
              {message}
            </p>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 active:bg-slate-600 rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-lg transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm font-bold uppercase tracking-wider">
            Cerrar Sesión
          </span>
        </button>
      </div>
    </div>
  );
}
