import { useRef, useState, useEffect } from 'react';
import { Loader2, Lock, LogOut, UserRound, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSeller, sellerLogout } from '@/modules/auth/slices/userSlice';
import { sellerLoginService, performLogout } from '@/modules/auth/services/authService';
import axiosInstance from '@/helpers/axiosInstance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/hooks/use-toast';
import { fetchCurrentStore } from '@/modules/stores/slices/storeThunks';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export const PinLockOverlay = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const { store, stores } = useAppSelector((state) => state.storeSlice);
  const storeId = store?.id || '';

  const [code, setCode] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [loginMode, setLoginMode] = useState<string>('CODE_AND_PIN');

  const codeRef = useRef<HTMLInputElement>(null);
  const pinRef = useRef<HTMLInputElement>(null);

  // Fetch login mode setting on mount
  useEffect(() => {
    const fetchLoginModeSetting = async () => {
      try {
        const response = await axiosInstance.get('/v1/settings?key=seller_login_mode');
        const records = response.data?.data || response.data || [];
        if (records.length > 0) {
          setLoginMode(records[0].value || 'CODE_AND_PIN');
        }
      } catch (e) {
        console.error('Error fetching login mode:', e);
      }
    };
    fetchLoginModeSetting();
  }, []);

  // Auto focus Code or PIN input on mount or when store is selected
  useEffect(() => {
    if (store) {
      const timer = setTimeout(() => {
        if (loginMode === 'PIN_ONLY') {
          pinRef.current?.focus();
        } else {
          codeRef.current?.focus();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [store, loginMode]);

  const handleStoreChange = (newStoreId: string) => {
    localStorage.setItem('currentStoreId', newStoreId);
    dispatch(fetchCurrentStore(newStoreId));

    // Al cambiar de sucursal, limpiamos los datos del vendedor y reseteamos el formulario
    localStorage.removeItem('seller_id');
    localStorage.removeItem('seller_name');
    localStorage.removeItem('seller_code');
    dispatch(sellerLogout());
    setCode('');
    setPin('');
    setError(null);
  };

  const handleVerify = async (currentPin: string) => {
    if (isVerifying) return;
    if (loginMode !== 'PIN_ONLY' && !code) {
      setError('Por favor ingrese su código de vendedor.');
      codeRef.current?.focus();
      return;
    }
    if (!currentPin) {
      setError('Por favor ingrese su PIN de seguridad.');
      pinRef.current?.focus();
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const res = await sellerLoginService(
        storeId,
        loginMode === 'PIN_ONLY' ? '' : code,
        currentPin
      );

      if (
        res.message === 'Invalid credentials' ||
        res.message === 'PIN o Código de vendedor incorrectos'
      ) {
        setError('PIN o Código de vendedor incorrectos.');
        setIsShaking(true);
        setPin('');
        setTimeout(() => setIsShaking(false), 400);
        pinRef.current?.focus();
      } else if (res.message === 'Seller not assigned to this store') {
        setError('El vendedor no está asignado a la sucursal seleccionada.');
        setIsShaking(true);
        setPin('');
        setTimeout(() => setIsShaking(false), 400);
        codeRef.current?.focus();
      } else if (res.seller) {
        // Guardar sesión del vendedor en localStorage
        localStorage.setItem('seller_id', res.seller.id);
        localStorage.setItem('seller_name', res.seller.name);
        localStorage.setItem('seller_code', res.seller.code);

        // Actualizar Redux
        dispatch(
          setSeller({
            id: res.seller.id,
            name: res.seller.name,
            code: res.seller.code
          })
        );

        toast({
          title: 'Acceso autorizado',
          description: `¡Bienvenido, ${res.seller.name}!`,
          variant: 'success'
        });
      } else {
        setError('Error al validar las credenciales.');
        setPin('');
        pinRef.current?.focus();
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeypadPress = (key: string) => {
    if (isVerifying) return;
    setError(null);

    if (key === 'C') {
      setPin('');
    } else if (key === '⌫') {
      setPin((prev) => prev.slice(0, -1));
    } else {
      if (pin.length < 10) {
        setPin((prev) => prev + key);
      }
    }
    pinRef.current?.focus();
  };

  const handleAdminLogout = () => {
    localStorage.clear();
    dispatch(performLogout());
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div
        className={cn(
          'w-full max-w-sm rounded-xl border bg-card text-card-foreground shadow-2xl p-6 flex flex-col items-center justify-center relative animate-in zoom-in-95 duration-200',
          'before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-sale-accent-strong before:rounded-t-xl'
        )}>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sale-accent-soft text-sale-accent-text border border-sale-accent-border mb-4 animate-bounce">
          <Lock className="h-6 w-6 animate-pulse" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-foreground text-center">
          Punto de Venta Protegido
        </h2>
        <p className="text-xs text-muted-foreground mt-1 text-center">
          Por favor ingresa tus credenciales de vendedor para desbloquear la pantalla.
        </p>

        {!store ? (
          <div className="w-full max-w-[240px] flex flex-col gap-4 mt-6">
            <div className="grid gap-1.5 w-full">
              <Label className="text-left text-xs font-semibold text-muted-foreground">
                Seleccionar Sucursal
              </Label>
              <Select value="" onValueChange={handleStoreChange}>
                <SelectTrigger className="h-9 w-full bg-transparent border-border text-foreground focus:ring-0 focus:ring-offset-0">
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
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Seleccione una sucursal para poder ingresar sus credenciales de vendedor.
            </p>
          </div>
        ) : (
          <>
            {/* Si hay múltiples sucursales, permitimos cambiarla en el mismo Lock screen */}
            {stores.length > 1 && (
              <div className="w-full max-w-[240px] flex flex-col gap-1.5 mt-4">
                <Label className="text-left text-xs font-semibold text-muted-foreground">
                  Sucursal
                </Label>
                <Select value={store.id} onValueChange={handleStoreChange}>
                  <SelectTrigger className="h-9 w-full bg-transparent border-border text-foreground focus:ring-0 focus:ring-offset-0">
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
              </div>
            )}

            {/* Si solo hay 1 sucursal, la mostramos estática como antes */}
            {stores.length === 1 && (
              <div className="text-xs font-semibold mt-4 text-foreground flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-lg border border-border/40">
                <Store className="w-4 h-4 text-sale-accent-text" />
                <span>Sucursal: {store.name}</span>
              </div>
            )}

            <div className="w-full max-w-[240px] flex flex-col gap-4 mt-6">
              {/* Seller Code Input */}
              {loginMode !== 'PIN_ONLY' && (
                <div className="grid gap-1 w-full">
                  <Label
                    htmlFor="code"
                    className="text-left text-xs font-semibold text-muted-foreground">
                    Código de Vendedor
                  </Label>
                  <div className="relative">
                    <UserRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="code"
                      ref={codeRef}
                      placeholder="Ej. VEND-01"
                      type="text"
                      autoCapitalize="characters"
                      autoComplete="off"
                      className="pl-9 h-9 text-sm focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-sale-accent"
                      disabled={isVerifying}
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value.toUpperCase());
                        setError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          pinRef.current?.focus();
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Pin Visual Representation */}
              <div className="grid gap-1 w-full">
                <Label className="text-left text-xs font-semibold text-muted-foreground">
                  PIN de Seguridad
                </Label>
                <div
                  className={cn(
                    'flex justify-center items-center gap-3.5 h-9 px-3 rounded-md bg-muted/30 border transition-all duration-200 w-full cursor-pointer relative',
                    isShaking && 'animate-shake border-destructive/50 bg-destructive/5',
                    error && !isShaking && 'border-destructive/30',
                    'focus-within:ring-1 focus-within:ring-sale-accent/40 focus-within:border-sale-accent'
                  )}
                  onClick={() => pinRef.current?.focus()}>
                  <input
                    ref={pinRef}
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={pin}
                    onChange={(e) => {
                      setPin(e.target.value.replace(/\D/g, ''));
                      setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleVerify(pin);
                      }
                    }}
                    className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                    disabled={isVerifying}
                    maxLength={10}
                  />
                  {pin.length === 0 ? (
                    <span className="text-muted-foreground/40 text-xs tracking-wider">
                      Ingresar PIN
                    </span>
                  ) : (
                    <div className="flex gap-2">
                      {pin.split('').map((_, i) => (
                        <div
                          key={i}
                          className="w-2.5 h-2.5 rounded-full bg-sale-accent animate-in zoom-in-75 duration-150"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-2.5 text-xs text-destructive font-medium animate-in fade-in-50 slide-in-from-top-1 text-center max-w-[240px]">
                {error}
              </p>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-[240px] mx-auto mt-5">
              {keys.map((key) => (
                <button
                  key={key}
                  type="button"
                  disabled={isVerifying}
                  onClick={() => handleKeypadPress(key)}
                  className={cn(
                    'h-10 rounded-lg border text-base font-semibold flex items-center justify-center transition-all',
                    'active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none',
                    key === 'C' || key === '⌫'
                      ? 'bg-muted hover:bg-muted/80 text-muted-foreground border-transparent text-sm'
                      : 'bg-background hover:bg-muted border-border hover:border-muted-foreground/20'
                  )}>
                  {key}
                </button>
              ))}
            </div>

            <Button
              type="button"
              disabled={isVerifying || pin.length < 4 || !code}
              onClick={() => handleVerify(pin)}
              className="w-full max-w-[240px] h-10 bg-sale-accent text-sale-accent-foreground hover:bg-sale-accent/90 font-medium rounded-lg mt-5 shadow-md transition-all flex items-center justify-center gap-2">
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validando...
                </>
              ) : (
                <>Desbloquear Pantalla</>
              )}
            </Button>
          </>
        )}

        <button
          type="button"
          onClick={handleAdminLogout}
          className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors font-medium cursor-pointer">
          <LogOut className="h-3.5 w-3.5" />
          <span>Cerrar sesión de administrador</span>
        </button>
      </div>
    </div>
  );
};
