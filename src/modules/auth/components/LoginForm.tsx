import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { cn } from '../../../lib/utils';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Icons } from '../../../components/ui/icons';
import { yupResolver } from '@hookform/resolvers/yup';
import { loginSchema } from '../helpers/loginSchema';
import { login } from '../services/authService';
import { useAppDispatch } from '../../../store/hooks';
import { setUser } from '../slices/userSlice';
import { IUserState } from '../slices/user.types';
import { useNavigate } from 'react-router';
import { Link } from 'react-router-dom';
import { useToast } from '../../../components/hooks/use-toast';
import { persistSessionToken } from '@/helpers/authSession';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginForm() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginForm>({
    defaultValues: {
      email: '',
      password: ''
    },
    mode: 'onChange',
    resolver: yupResolver<LoginForm>(loginSchema)
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await login(data.email, data.password);

      if (res.message === 'Invalid credentials') {
        setErrorMessage('Credenciales inválidas, intente de nuevo');
      } else {
        const user: IUserState = {
          id: res.attributes.id,
          orgId: res.attributes.organization_id,
          email: data.email,
          token: res.token,
          sellerId: res.attributes.seller_id
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

  return (
    <div className={cn('grid gap-6')}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          <div className="grid mb-8">
            <Label htmlFor="email">Correo electrónico *</Label>
            <Input
              id="email"
              placeholder="nombre@ejemplo.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              {...register('email')}
            />
            <div className="form-error-slot">
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <Label htmlFor="password">Contraseña *</Label>
            <Input
              id="password"
              placeholder="Contraseña"
              type="password"
              autoCapitalize="none"
              autoComplete="current-password"
              autoCorrect="off"
              disabled={isLoading}
              {...register('password')}
            />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>

          <div className="flex flex-col gap-4 ">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              Accesar
            </Button>

            <span className="text-center mt-2 -mb-2">
              ¿no tienes una cuenta?{' '}
              <Link to="/register" className="underline text-slate-500">
                Registrate
              </Link>
            </span>
          </div>

          {errorMessage && <span className="text-red-500 text-center">{errorMessage}</span>}
        </div>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
      </div>
    </div>
  );
}
