import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '../slices/userSlice';
import { IUserState } from '../slices/user.types';
import { claimMagicLinkService } from '../services/authService';
import { persistSessionToken } from '@/helpers/authSession';
import { fetchCurrentStore, fetchStores } from '@/modules/stores/slices/storeThunks';
import { BrandLogo, BrandMark } from '@/components/BrandLogo';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function ActivateTerminal() {
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [details, setDetails] = useState<{
    storeName?: string;
    sellerName?: string;
  }>({});

  const hasClaimedRef = useRef(false);

  useEffect(() => {
    // Extraer token de múltiples fuentes posibles (HashRouter vs Browser query params)
    let token = searchParams.get('token');
    if (!token && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      token = urlParams.get('token');
      if (!token && window.location.hash.includes('?')) {
        const hashQuery = window.location.hash.split('?')[1];
        const hashParams = new URLSearchParams(hashQuery);
        token = hashParams.get('token');
      }
    }

    if (!token) {
      setStatus('error');
      setErrorMessage('No se encontró el token de activación en el enlace.');
      return;
    }

    if (hasClaimedRef.current) return;
    hasClaimedRef.current = true;

    async function activate(tokenToClaim: string) {
      try {
        const res = await claimMagicLinkService(tokenToClaim);

        if (!res || !res.token) {
          setStatus('error');
          setErrorMessage(
            res?.message || 'El enlace es inválido, ya fue utilizado o ha expirado.'
          );
          return;
        }

        // 1. Guardar token de sesión
        persistSessionToken(res.token);

        // 2. Establecer usuario en Redux
        const user: IUserState = {
          id: res.attributes?.id || res.id || '',
          orgId: res.attributes?.organization_id || res.organization_id || '',
          email: res.attributes?.email || '',
          token: res.token,
          sellerId: res.seller?.id || res.attributes?.seller_id || '',
          sellerName: res.seller?.name || '',
          sellerCode: res.seller?.code || '',
          isSellerAuthenticated: false, // Se solicitará el PIN en el Lock Screen
          mustChangePassword: false,
          avatar: res.attributes?.avatar || '',
          googleId: res.attributes?.google_id || '',
          name: res.attributes?.name || ''
        };

        dispatch(setUser(user));

        // 3. Pre-seleccionar sucursal si vino en el link
        if (res.store_id) {
          localStorage.setItem('currentStoreId', res.store_id);
          dispatch(fetchCurrentStore(res.store_id));
        }

        // 4. Pre-llenar código de vendedor si vino asignado
        if (res.seller) {
          localStorage.setItem('seller_id', res.seller.id);
          localStorage.setItem('seller_name', res.seller.name);
          localStorage.setItem('seller_code', res.seller.code);
        }

        // 5. Cargar lista de tiendas
        await dispatch(fetchStores());

        setDetails({
          sellerName: res.seller?.name,
          storeName: res.store?.name
        });

        setStatus('success');

        // Redirigir a la pantalla principal (Lock Screen de PIN) tras breve confirmación visual
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(
          err.message || 'Ocurrió un error al intentar vincular la terminal.'
        );
      }
    }

    activate(token);
  }, [searchParams, dispatch, navigate]);

  return (
    <div className="relative grid min-h-[100dvh] grid-cols-1 lg:grid-cols-2">
      {/* Branding en pantallas grandes */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex h-full flex-col items-center justify-center gap-4">
          <BrandMark size={120} />
          <span className="text-3xl font-bold tracking-tight">
            <span className="text-[#8FB2F9]">Diple</span>
            <span className="text-[#B39DF2]">Bill</span>
          </span>
          <p className="text-sm text-zinc-400">Punto de Venta</p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex items-center justify-center p-6 lg:p-8">
        <div className="mx-auto flex w-full max-w-[380px] flex-col justify-center space-y-6 text-center">
          <BrandLogo size={36} className="mx-auto mb-2 lg:hidden" />

          {status === 'loading' && (
            <div className="space-y-4 py-8">
              <div className="flex justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">Vinculando Terminal...</h2>
              <p className="text-sm text-muted-foreground">
                Estamos validando tu enlace de acceso seguro. Un momento por favor.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4 py-8">
              <div className="inline-flex p-3 rounded-full bg-green-500/15 text-green-500 mb-2">
                <CheckCircle2 className="h-12 w-12" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground">
                ¡Terminal Vinculada con Éxito!
              </h2>
              {details.sellerName && (
                <p className="text-sm text-foreground font-medium">
                  Vendedor: <span className="text-primary">{details.sellerName}</span>
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Redirigiendo a la pantalla de PIN de seguridad...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-5 py-4">
              <div className="inline-flex p-3 rounded-full bg-destructive/15 text-destructive mb-1">
                <AlertTriangle className="h-12 w-12" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  Enlace no válido
                </h2>
                <p className="text-sm text-muted-foreground">
                  {errorMessage || 'Este enlace ya fue utilizado o ha expirado.'}
                </p>
              </div>

              <div className="p-3 bg-muted/60 rounded-lg text-xs text-muted-foreground text-left space-y-1">
                <p className="font-semibold text-foreground">¿Qué puedes hacer?</p>
                <p>• Solicita al propietario de la tienda un nuevo enlace de activación.</p>
                <p>• O inicia sesión con correo y contraseña si eres el dueño.</p>
              </div>

              <Button
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center gap-2"
              >
                Ir a Inicio de Sesión
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
