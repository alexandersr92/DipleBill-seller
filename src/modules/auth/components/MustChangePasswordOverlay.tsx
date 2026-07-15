import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { ShieldAlert, KeyRound, Eye, EyeOff, Loader2, LogOut } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { store } from '@/store/store';
import { setUser } from '@/modules/auth/slices/userSlice';
import { performLogout, updateAccountPassword } from '@/modules/auth/services/authService';
import { changePasswordSchema } from '../helpers/changePasswordSchema';
import { useToast } from '@/components/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export function MustChangePasswordOverlay() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(changePasswordSchema),
    defaultValues: {
      current_password: '',
      password: '',
      password_confirmation: '',
    },
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await updateAccountPassword({
        current_password: data.current_password,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });

      toast({
        title: 'Contraseña actualizada',
        description: 'Tu contraseña se ha cambiado con éxito.',
        variant: 'success',
      });

      // Actualizar el estado de Redux para desactivar el overlay bloqueante
      const currentUserState = { ...store.getState().userSlice };
      dispatch(
        setUser({
          ...currentUserState,
          mustChangePassword: false,
        })
      );
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Error al actualizar la contraseña.';
      toast({
        title: 'Error de cambio de contraseña',
        description: errorMsg,
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(performLogout());
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border-2 border-indigo-900/50 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col my-8">
        {/* Decorative background blurs */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center mb-6">
          <div className="p-4 bg-indigo-950/40 rounded-full border border-indigo-800/40 mb-4 shadow-lg shadow-indigo-900/20">
            <ShieldAlert size={40} className="text-indigo-400" />
          </div>
          <h2 className="text-white text-xl font-black tracking-tight uppercase text-center mb-1">
            Cambio Obligatorio
          </h2>
          <p className="text-slate-400 text-xs font-medium text-center leading-relaxed max-w-sm">
            Por motivos de seguridad, tu administrador requiere que actualices la contraseña asignada por defecto antes de continuar.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5 relative">
            <Label htmlFor="current_password">Contraseña actual (temporal)</Label>
            <div className="relative">
              <Input
                id="current_password"
                type={showPassword.current ? 'text' : 'password'}
                placeholder="••••••••"
                className="bg-slate-950 border-slate-800 text-white rounded-xl pr-10"
                {...register('current_password')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
              >
                {showPassword.current ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.current_password && (
              <p className="text-red-500 text-[11px] font-bold mt-0.5">{errors.current_password.message}</p>
            )}
          </div>

          <div className="space-y-1.5 relative">
            <Label htmlFor="password">Nueva contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword.new ? 'text' : 'password'}
                placeholder="••••••••"
                className="bg-slate-950 border-slate-800 text-white rounded-xl pr-10"
                {...register('password')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
              >
                {showPassword.new ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-[11px] font-bold mt-0.5">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5 relative">
            <Label htmlFor="password_confirmation">Confirmar nueva contraseña</Label>
            <div className="relative">
              <Input
                id="password_confirmation"
                type={showPassword.confirm ? 'text' : 'password'}
                placeholder="••••••••"
                className="bg-slate-950 border-slate-800 text-white rounded-xl pr-10"
                {...register('password_confirmation')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
              >
                {showPassword.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password_confirmation && (
              <p className="text-red-500 text-[11px] font-bold mt-0.5">{errors.password_confirmation.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold rounded-xl py-5 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 mt-6"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <KeyRound size={16} />
            )}
            <span>ACTUALIZAR CONTRASEÑA</span>
          </Button>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full bg-transparent hover:bg-slate-800/40 text-slate-400 hover:text-white rounded-xl py-2.5 flex items-center justify-center gap-2 border border-slate-800 hover:border-slate-700 mt-2 transition-colors"
          >
            <LogOut size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Cerrar Sesión</span>
          </button>
        </form>
      </div>
    </div>
  );
}
