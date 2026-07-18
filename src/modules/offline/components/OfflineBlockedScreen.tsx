import { useState } from 'react';
import { CloudOff, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { verifyConnection } from '../connectivity';

interface IOfflineBlockedScreenProps {
  message?: string;
}

// Pantalla bloqueante: sin conexión y sin sesión previa cacheada no se puede
// operar (decisión de negocio: no se abre sesión/caja offline).
export const OfflineBlockedScreen = ({ message }: IOfflineBlockedScreenProps) => {
  const [isChecking, setIsChecking] = useState(false);

  const handleRetry = async () => {
    setIsChecking(true);
    const ok = await verifyConnection();
    setIsChecking(false);
    if (ok) {
      // Reintentar el flujo completo de arranque con red disponible.
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background p-4 select-none">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl border bg-card p-8 text-center shadow-lg">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-offline-accent-soft text-offline-accent">
          <CloudOff className="h-7 w-7" />
        </div>
        <h1 className="text-lg font-bold">Sin conexión</h1>
        <p className="text-sm text-muted-foreground">
          {message ||
            'No es posible operar sin conexión porque no existe una sesión previa iniciada. Conéctese a internet e inicie sesión para habilitar el modo offline.'}
        </p>
        <Button type="button" onClick={handleRetry} disabled={isChecking} className="mt-2">
          {isChecking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verificando…
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar conexión
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
