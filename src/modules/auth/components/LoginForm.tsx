import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { cn } from '../../../lib/utils';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { yupResolver } from '@hookform/resolvers/yup';
import { loginSchema } from '../helpers/loginSchema';
import { login, sendPasswordResetCode, resetPasswordWithCode } from '../services/authService';
import { useAppDispatch } from '../../../store/hooks';
import { setUser } from '../slices/userSlice';
import { IUserState } from '../slices/user.types';
import { useNavigate } from 'react-router';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/hooks/use-toast';
import { persistSessionToken } from '@/helpers/authSession';
import { Loader2, KeyRound, Eye, EyeOff, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface LoginFormInputs {
  email: string;
  password: string;
}

export default function LoginForm() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estados de vista para el flujo de autenticación y restablecimiento
  const [view, setView] = useState<'login' | 'forgot_password' | 'enter_code' | 'reset_password'>('login');
  
  // Variables auxiliares para el flujo de restablecimiento
  const [resetEmail, setResetEmail] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [showPassword, setShowPassword] = useState({ login: false, new: false, confirm: false });

  // 1. Formulario de Inicio de Sesión
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: errorsLogin }
  } = useForm<LoginFormInputs>({
    defaultValues: { email: '', password: '' },
    resolver: yupResolver(loginSchema)
  });

  const onSubmitLogin = async (data: LoginFormInputs) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await login(data.email, data.password || '');

      if (res.message === 'Invalid credentials') {
        setErrorMessage('Credenciales inválidas, intente de nuevo');
      } else {
        const storedSellerId = localStorage.getItem('seller_id') || '';
        const storedSellerName = localStorage.getItem('seller_name') || '';
        const storedSellerCode = localStorage.getItem('seller_code') || '';
        const hasSeller = !!storedSellerId;

        const user: IUserState = {
          id: res.attributes?.id || res.id || '',
          orgId: res.attributes?.organization_id || res.organization_id || '',
          email: data.email,
          token: res.token,
          sellerId: storedSellerId || res.attributes?.seller_id || res.seller_id || '',
          sellerName: storedSellerName,
          sellerCode: storedSellerCode,
          isSellerAuthenticated: hasSeller,
          mustChangePassword: res.attributes?.must_change_password || res.must_change_password || false,
          avatar: res.attributes?.avatar || res.avatar || ''
        };
        persistSessionToken(user.token);
        dispatch(setUser(user));
        navigate('/');
      }
    } catch (error) {
      setErrorMessage('Ha ocurrido un error inesperado, intenta de nuevo');
      toast({
        title: 'Error al iniciar sesión',
        description: 'Ha ocurrido un error inesperado, intenta de nuevo.',
        variant: 'error'
      });
      if (import.meta.env.DEV) console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Formulario de Solicitud de Código ("Olvidé mi contraseña")
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotError('El correo electrónico es requerido');
      return;
    }
    setForgotError('');
    setIsLoading(true);

    try {
      await sendPasswordResetCode(forgotEmail);
      setResetEmail(forgotEmail);
      toast({
        title: 'Código enviado',
        description: 'Hemos enviado un código de verificación de 6 dígitos a tu correo.',
        variant: 'success'
      });
      setView('enter_code');
    } catch (error: any) {
      setForgotError(error.message || 'Error al solicitar el código.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Formulario de Verificación del Código
  const [codeVal, setCodeVal] = useState('');
  const [codeError, setCodeError] = useState('');

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeVal || codeVal.length !== 6) {
      setCodeError('Debes ingresar el código de 6 dígitos');
      return;
    }
    setCodeError('');
    setVerificationCode(codeVal);
    setView('reset_password');
  };

  // 4. Formulario de Restablecimiento Final de Contraseña
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [resetErrorMsg, setResetErrorMsg] = useState('');

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass || newPass.length < 6) {
      setResetErrorMsg('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPass !== confirmPass) {
      setResetErrorMsg('Las contraseñas no coinciden');
      return;
    }
    setResetErrorMsg('');
    setIsLoading(true);

    try {
      await resetPasswordWithCode({
        email: resetEmail,
        code: verificationCode,
        password: newPass,
        password_confirmation: confirmPass
      });

      toast({
        title: 'Contraseña restablecida',
        description: 'Tu contraseña se cambió con éxito. Ya puedes iniciar sesión.',
        variant: 'success'
      });
      
      // Reiniciar estados y volver al login
      setView('login');
      setResetEmail('');
      setVerificationCode('');
      setCodeVal('');
      setNewPass('');
      setConfirmPass('');
    } catch (error: any) {
      setResetErrorMsg(error.message || 'Error al restablecer la contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Simular login con Google (Preparación)
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // Nota: Aquí se integrará el SDK de Google Client en el futuro.
      // Simulamos la obtención de un token y su envío al backend
      toast({
        title: 'Google OAuth',
        description: 'Simulando el inicio de sesión con Google...',
        variant: 'default'
      });
    } catch (error: any) {
      toast({
        title: 'Google Auth Error',
        description: error.message || 'No se pudo iniciar sesión con Google.',
        variant: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // RENDER SECCIONAL SEGÚN LA VISTA ACTIVA
  return (
    <div className={cn('grid gap-6 w-full max-w-sm mx-auto')}>
      
      {/* VISTA 1: INICIO DE SESIÓN */}
      {view === 'login' && (
        <>
          <form onSubmit={handleSubmitLogin(onSubmitLogin)}>
            <div className="grid gap-4">
              <div className="grid gap-2 mb-2">
                <Label htmlFor="email">Correo electrónico *</Label>
                <Input
                  id="email"
                  placeholder="nombre@ejemplo.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={isLoading}
                  {...registerLogin('email')}
                />
                <div className="form-error-slot min-h-[16px]">
                  {errorsLogin.email && <p className="text-red-500 text-[11px] font-bold mt-0.5">{errorsLogin.email.message}</p>}
                </div>

                <div className="flex justify-between items-center mt-2">
                  <Label htmlFor="password">Contraseña *</Label>
                  <button
                    type="button"
                    onClick={() => setView('forgot_password')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    placeholder="Contraseña"
                    type={showPassword.login ? 'text' : 'password'}
                    autoCapitalize="none"
                    autoComplete="current-password"
                    autoCorrect="off"
                    disabled={isLoading}
                    className="pr-10"
                    {...registerLogin('password')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    onClick={() => setShowPassword({ ...showPassword, login: !showPassword.login })}
                  >
                    {showPassword.login ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="form-error-slot min-h-[16px]">
                  {errorsLogin.password && <p className="text-red-500 text-[11px] font-bold mt-0.5">{errorsLogin.password.message}</p>}
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-2">
                <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl py-5">
                  {isLoading && <Loader2 size={16} className="mr-2 animate-spin" />}
                  ACCESAR
                </Button>

                <span className="text-center text-xs text-slate-400">
                  ¿No tienes una cuenta?{' '}
                  <Link to="/register" className="underline text-indigo-400 hover:text-indigo-300 font-semibold">
                    Regístrate
                  </Link>
                </span>
              </div>

              {errorMessage && <span className="text-red-500 text-center text-xs font-bold mt-2">{errorMessage}</span>}
            </div>
          </form>

          {/* Botón de Google OAuth (Preparación) */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">O continúa con</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={handleGoogleLogin}
            className="border-slate-800 hover:bg-slate-900 rounded-xl py-5 flex items-center justify-center gap-2"
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            Google
          </Button>
        </>
      )}

      {/* VISTA 2: SOLICITUD DE CÓDIGO (FORGOT PASSWORD) */}
      {view === 'forgot_password' && (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="forgot_email">Ingresa tu correo electrónico</Label>
            <Input
              id="forgot_email"
              placeholder="nombre@ejemplo.com"
              type="email"
              disabled={isLoading}
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
            />
            {forgotError && <p className="text-red-500 text-[11px] font-bold mt-0.5">{forgotError}</p>}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl py-5">
            {isLoading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Mail size={16} className="mr-2" />}
            ENVIAR CÓDIGO DE VERIFICACIÓN
          </Button>

          <button
            type="button"
            onClick={() => setView('login')}
            className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white mt-4 font-semibold transition-colors"
          >
            <ArrowLeft size={14} /> Volver al Inicio de Sesión
          </button>
        </form>
      )}

      {/* VISTA 3: VERIFICACIÓN DEL CÓDIGO (ENTER CODE) */}
      {view === 'enter_code' && (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div className="flex flex-col space-y-2 text-center mb-2">
            <p className="text-xs text-slate-400">
              Ingresa el código de 6 dígitos que enviamos a <strong>{resetEmail}</strong>.
            </p>
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="code_val" className="text-center">Código de verificación</Label>
            <Input
              id="code_val"
              placeholder="123456"
              type="text"
              maxLength={6}
              className="text-center font-bold tracking-widest text-lg py-5 bg-slate-950 border-slate-800 text-white rounded-xl"
              value={codeVal}
              onChange={(e) => setCodeVal(e.target.value.replace(/\D/g, ''))}
            />
            {codeError && <p className="text-red-500 text-[11px] font-bold text-center mt-0.5">{codeError}</p>}
          </div>

          <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl py-5">
            <CheckCircle2 size={16} className="mr-2" />
            VERIFICAR CÓDIGO
          </Button>

          <button
            type="button"
            onClick={() => setView('forgot_password')}
            className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white mt-4 font-semibold transition-colors"
          >
            <ArrowLeft size={14} /> Volver a ingresar correo
          </button>
        </form>
      )}

      {/* VISTA 4: RESTABLECER LA CONTRASEÑA */}
      {view === 'reset_password' && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="flex flex-col space-y-1.5 relative">
            <Label htmlFor="new_password">Nueva contraseña</Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showPassword.new ? 'text' : 'password'}
                placeholder="••••••••"
                className="bg-slate-950 border-slate-800 text-white rounded-xl pr-10"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
              >
                {showPassword.new ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="flex flex-col space-y-1.5 relative">
            <Label htmlFor="confirm_password">Confirmar contraseña</Label>
            <div className="relative">
              <Input
                id="confirm_password"
                type={showPassword.confirm ? 'text' : 'password'}
                placeholder="••••••••"
                className="bg-slate-950 border-slate-800 text-white rounded-xl pr-10"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
              >
                {showPassword.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {resetErrorMsg && <p className="text-red-500 text-[11px] font-bold mt-0.5">{resetErrorMsg}</p>}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 font-bold rounded-xl py-5 mt-6">
            {isLoading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <KeyRound size={16} className="mr-2" />}
            ACTUALIZAR CONTRASEÑA
          </Button>

          <button
            type="button"
            onClick={() => setView('login')}
            className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white mt-4 font-semibold transition-colors"
          >
            <ArrowLeft size={14} /> Cancelar y Volver
          </button>
        </form>
      )}

    </div>
  );
}
