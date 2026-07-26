import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Aviso de "nueva versión disponible" para el POS. Con registerType: 'prompt',
 * el service worker NO se activa/recarga solo — el cajero toca "Actualizar"
 * cuando termina la venta en curso, evitando perder datos a media digitación.
 */
export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[9998] flex items-center justify-between gap-3 bg-indigo-600 px-4 py-2 text-sm text-white shadow-lg">
      <span className="font-medium">Hay una nueva versión disponible.</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="shrink-0 rounded-md bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-white/30"
      >
        Actualizar
      </button>
    </div>
  );
}
