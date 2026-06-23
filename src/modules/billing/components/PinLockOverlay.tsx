import { useRef, useState, useEffect } from 'react';
import { Loader2, KeyRound, Lock, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { sellerLogout } from '@/modules/auth/slices/userSlice';
import { sellerLoginService } from '@/modules/auth/services/authService';
import { useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';

interface PinLockOverlayProps {
  onUnlock: () => void;
}

export const PinLockOverlay = ({ onUnlock }: PinLockOverlayProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { sellerName, sellerCode } = useAppSelector((state) => state.userSlice);
  const storeId =
    useAppSelector((state) => state.storeSlice.store?.id) ||
    localStorage.getItem('currentStoreId') ||
    '';

  const [pin, setPin] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setPin(val);
    setError(null);
  };

  const handleVerify = async (currentPin: string) => {
    if (isVerifying) return;
    if (!currentPin) {
      setError('Por favor ingrese su PIN.');
      inputRef.current?.focus();
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const res = await sellerLoginService(storeId, sellerCode || '', currentPin);

      if (res.message === 'Invalid credentials' || res.message === 'PIN o Código de vendedor incorrectos') {
        setError('PIN incorrecto. Intente de nuevo.');
        setIsShaking(true);
        setPin('');
        setTimeout(() => setIsShaking(false), 400);
        inputRef.current?.focus();
      } else if (res.seller) {
        onUnlock();
      } else {
        setError('Error al validar el PIN.');
        setPin('');
        inputRef.current?.focus();
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleVerify(pin);
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
    inputRef.current?.focus();
  };

  const handleLogout = () => {
    localStorage.removeItem('seller_id');
    localStorage.removeItem('seller_name');
    localStorage.removeItem('seller_code');
    dispatch(sellerLogout());
    navigate('/seller-login');
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'];

  return (
    <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div 
        className={cn(
          "w-full max-w-sm rounded-xl border bg-card text-card-foreground shadow-2xl p-6 flex flex-col items-center justify-center relative animate-in zoom-in-95 duration-200",
          "before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-sale-accent-strong before:rounded-t-xl"
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sale-accent-soft text-sale-accent-text border border-sale-accent-border mb-4 animate-bounce">
          <Lock className="h-6 w-6 animate-pulse" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-foreground text-center">Punto de Venta Protegido</h2>
        <p className="text-xs text-muted-foreground mt-1 text-center">
          Para iniciar una nueva venta, confirma tu identidad ingresando tu PIN de seguridad.
        </p>

        <div className="text-xs font-semibold mt-4 text-foreground flex items-center gap-1.5 bg-muted/60 px-3 py-1.5 rounded-lg border border-border/40">
          <KeyRound className="w-4 h-4 text-sale-accent-text" />
          <span>{sellerName} ({sellerCode})</span>
        </div>

        <input
          ref={inputRef}
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          value={pin}
          onChange={handlePinChange}
          onKeyDown={handleInputKeyDown}
          className="opacity-0 absolute pointer-events-none w-0 h-0"
          disabled={isVerifying}
          maxLength={10}
        />

        {/* Visual Dots */}
        <div 
          className={cn(
            "flex justify-center items-center gap-3.5 h-12 px-6 rounded-xl bg-muted/30 border transition-all duration-200 w-full max-w-[220px] cursor-pointer mt-6",
            isShaking && "animate-shake border-destructive/50 bg-destructive/5",
            error && !isShaking && "border-destructive/30",
            "focus-within:ring-2 focus-within:ring-sale-accent/40 focus-within:border-sale-accent"
          )}
          onClick={() => inputRef.current?.focus()}
        >
          {pin.length === 0 ? (
            <span className="text-muted-foreground/40 text-xs tracking-wider">PIN de Seguridad</span>
          ) : (
            <div className="flex gap-3">
              {pin.split('').map((_, i) => (
                <div 
                  key={i} 
                  className="w-3.5 h-3.5 rounded-full bg-sale-accent animate-in zoom-in-75 duration-150" 
                />
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-2.5 text-xs text-destructive font-medium animate-in fade-in-50 slide-in-from-top-1 text-center">
            {error}
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-[220px] mx-auto mt-6">
          {keys.map((key) => (
            <button
              key={key}
              type="button"
              disabled={isVerifying}
              onClick={() => handleKeypadPress(key)}
              className={cn(
                "h-12 rounded-lg border text-base font-semibold flex items-center justify-center transition-all",
                "active:scale-95 disabled:opacity-50 disabled:pointer-events-none select-none",
                key === 'C' || key === '⌫' 
                  ? "bg-muted hover:bg-muted/80 text-muted-foreground border-transparent text-sm" 
                  : "bg-background hover:bg-muted border-border hover:border-muted-foreground/20"
              )}
            >
              {key}
            </button>
          ))}
        </div>

        <Button
          type="button"
          disabled={isVerifying || pin.length < 4}
          onClick={() => handleVerify(pin)}
          className="w-full h-11 bg-sale-accent text-sale-accent-foreground hover:bg-sale-accent/90 font-medium rounded-lg mt-6 shadow-md transition-all flex items-center justify-center gap-2"
        >
          {isVerifying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Validando...
            </>
          ) : (
            <>
              Desbloquear Pantalla
            </>
          )}
        </Button>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors font-medium cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Cerrar sesión de vendedor</span>
        </button>
      </div>
    </div>
  );
};
