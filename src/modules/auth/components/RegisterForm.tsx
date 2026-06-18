import { useNavigate } from 'react-router';
import { useAppDispatch } from '../../../store/hooks';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Button } from '../../../components/ui/button';
import { Link } from 'react-router-dom';
import { Icons } from '../../../components/ui/icons';
import { registerSchema } from '../helpers/registerSchema';
import { registerService } from '../services/authService';
import { IUserState } from '../slices/user.types';
import { setUser } from '../slices/userSlice';
import type { IRegisterForm } from '../types';
import { useToast } from '../../../components/hooks/use-toast';
import { persistSessionToken } from '@/helpers/authSession';

export default function RegisterForm() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<IRegisterForm>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      password_confirm: ''
    },
    mode: 'onChange',
    resolver: yupResolver(registerSchema)
  });

  const onSubmit = async (data: IRegisterForm) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await registerService(data);

      if (res.message === 'User already registered') {
        setErrorMessage('El Correo ya está registrado en el sistema');
        setIsLoading(false);
      } else {
        const user: IUserState = {
          id: res.attributes.id,
          orgId: res.attributes.organization_id,
          email: data.email,
          token: res.token,
          isAuthenticated: true
        };
        persistSessionToken(user.token);
        dispatch(setUser(user));
        navigate('/organization');
      }
    } catch (error: unknown) {
      const axiosErr = error as { response?: { data?: { message?: string } } };
      if (axiosErr.response) {
        setErrorMessage('Error del servidor: ' + axiosErr.response.data?.message);
      } else {
        setErrorMessage('Ha ocurrido un error inesperado. Intente de nuevo.');
      }
      toast({
        title: 'Error al registrarse',
        description: 'Ha ocurrido un error inesperado. Intente de nuevo.',
        variant: 'error'
      });
      if (import.meta.env.DEV) console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          <div className="grid gap-4 mb-8">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              placeholder="Tu nombre"
              type="text"
              autoCapitalize="none"
              disabled={isLoading}
              {...register('name')}
            />
            <div className="form-error-slot">
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>

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
            <div className="form-error-slot">
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            <Label htmlFor="password_confirm">Confirmar contraseña *</Label>
            <Input
              id="password_confirm"
              placeholder="Confirma tu contraseña"
              type="password"
              autoCapitalize="none"
              autoComplete="current-password"
              autoCorrect="off"
              disabled={isLoading}
              {...register('password_confirm')}
            />
            <div className="form-error-slot">
              {errors.password_confirm && <p className="form-error">{errors.password_confirm.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              Registrarse
            </Button>

            {errorMessage && <span className="text-red-500 text-center">{errorMessage}</span>}

            <span className="text-center mt-2 -mb-2">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="underline text-slate-500">
                Accesa
              </Link>
            </span>
          </div>
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
