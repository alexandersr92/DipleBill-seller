import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useNavigate } from 'react-router';
import { sellerLoginService } from '../services/authService';
import { setSeller } from '../slices/userSlice';
import { fetchStores, fetchCurrentStore } from '@/modules/stores/slices/storeThunks';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { useToast } from '@/components/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { KeyRound, Store, UserRound, ArrowRight } from 'lucide-react';

import { useValidateToken } from '../hooks/useValidateToken';
import { Navigate } from 'react-router';
import LoginSkeleton from '../components/LoginSkeleton';

interface SellerLoginForm {
  store_id: string;
  code: string;
  pin: string;
}

export default function SellerLogin() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isValidated = useValidateToken();
  const isSellerAuthenticated = useAppSelector((state) => state.userSlice.isSellerAuthenticated);
  const { stores } = useAppSelector((state) => state.storeSlice);
  const { email } = useAppSelector((state) => state.userSlice);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors }
  } = useForm<SellerLoginForm>({
    defaultValues: {
      store_id: '',
      code: '',
      pin: ''
    }
  });

  useEffect(() => {
    if (isValidated) {
      dispatch(fetchStores());
    }
  }, [dispatch, isValidated]);

  if (isValidated === null) {
    return <LoginSkeleton />;
  }

  if (!isValidated) {
    return <Navigate to="/login" />;
  }

  if (isSellerAuthenticated) {
    return <Navigate to="/venta" />;
  }

  const onSubmit = async (data: SellerLoginForm) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await sellerLoginService(data.store_id, data.code, data.pin);

      if (res.message === 'Invalid credentials') {
        setErrorMessage('PIN o Código de vendedor incorrectos');
      } else if (res.message === 'Seller not assigned to this store') {
        setErrorMessage('El vendedor no está asignado a la tienda seleccionada');
      } else if (res.seller && res.store) {
        // Guardar sesión del vendedor en localStorage
        localStorage.setItem('seller_id', res.seller.id);
        localStorage.setItem('seller_name', res.seller.name);
        localStorage.setItem('seller_code', res.seller.code);
        localStorage.setItem('currentStoreId', res.store.id);

        // Guardar en Redux
        dispatch(
          setSeller({
            id: res.seller.id,
            name: res.seller.name,
            code: res.seller.code
          })
        );
        dispatch(fetchCurrentStore(res.store.id));

        toast({
          title: 'Sesión iniciada',
          description: `¡Bienvenido al punto de venta, ${res.seller.name}!`,
          variant: 'success'
        });

        navigate('/venta');
      } else {
        setErrorMessage('Error al iniciar sesión como vendedor');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Ha ocurrido un error inesperado, intenta de nuevo');
      toast({
        title: 'Error de acceso',
        description: error.message || 'Error al conectar con el servidor.',
        variant: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogout = () => {
    // Limpiar toda la sesión y volver al login de owner
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="container relative min-h-screen flex items-center justify-center lg:max-w-none lg:grid lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center gap-2 text-lg font-medium">
          <Store className="h-6 w-6" />
          <span>DipleBill POS</span>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Estás ingresando al Punto de Facturación de DipleBill. Autenticación
              restringida para vendedores autorizados.&rdquo;
            </p>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8 p-4 w-full">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[380px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Acceso de Vendedor</h1>
            <p className="text-sm text-muted-foreground">
              Cuenta de administración activa:{' '}
              <span className="font-semibold text-foreground">{email}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="store_id">Tienda / Sucursal *</Label>
                <Controller
                  control={control}
                  name="store_id"
                  rules={{ required: 'Debes seleccionar una sucursal' }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="store_id" className="h-10">
                        <SelectValue placeholder="Seleccionar Sucursal" />
                      </SelectTrigger>
                      <SelectContent>
                        {stores.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.store_id && (
                  <p className="text-xs text-destructive">{errors.store_id.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="code">Código de Vendedor *</Label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="code"
                    placeholder="Código (ej. VEND-01)"
                    type="text"
                    autoCapitalize="characters"
                    autoComplete="off"
                    className="pl-9 h-10"
                    disabled={isLoading}
                    {...register('code', { required: 'El código de vendedor es requerido' })}
                  />
                </div>
                {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="pin">PIN de Acceso *</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="pin"
                    placeholder="PIN numérico"
                    type="password"
                    maxLength={10}
                    className="pl-9 h-10"
                    disabled={isLoading}
                    {...register('pin', { required: 'El PIN de seguridad es requerido' })}
                  />
                </div>
                {errors.pin && <p className="text-xs text-destructive">{errors.pin.message}</p>}
              </div>

              {errorMessage && (
                <div className="p-3 bg-destructive/15 border border-destructive/30 rounded-md text-sm text-destructive text-center">
                  {errorMessage}
                </div>
              )}

              <Button type="submit" className="w-full h-10 mt-2" disabled={isLoading}>
                {isLoading ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Entrar al Punto de Venta
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Opciones</span>
          </div>

          <Button
            variant="ghost"
            onClick={handleAdminLogout}
            className="w-full text-muted-foreground"
          >
            Cerrar Sesión de Administrador
          </Button>
        </div>
      </div>
    </div>
  );
}
