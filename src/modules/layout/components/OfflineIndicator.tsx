import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const syncCount = useLiveQuery(() => db.sync_queue.count(), []);

  if (!isOffline && syncCount === 0) return null;

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-colors ${
        isOffline ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
      }`}
    >
      <WifiOff className="w-3.5 h-3.5" />
      <span>
        {isOffline ? 'Modo Sin Conexión' : 'Conectado'}
      </span>
      {syncCount !== undefined && syncCount > 0 && (
        <span className="ml-1 bg-background px-1.5 py-0.5 rounded-full text-[10px]">
          {syncCount} pendientes
        </span>
      )}
    </div>
  );
}
