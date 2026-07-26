import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import './index.css';
import { Toaster } from '@/components/ui/toaster.tsx';
import { initSentry } from '@/helpers/sentry';

initSentry();

// Fallback global: sin esto, cualquier error de render dejaba la pantalla en
// blanco a media jornada, sin explicación ni salida. Sentry.ErrorBoundary
// además reporta el error automáticamente.
function ErrorFallback() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950 p-6 text-center">
      <div className="max-w-md">
        <h1 className="mb-2 text-xl font-bold text-white">Algo salió mal</h1>
        <p className="mb-6 text-sm leading-relaxed text-slate-400">
          Ocurrió un error inesperado. Recarga la app; si el problema continúa,
          contáctanos.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-indigo-500"
        >
          Recargar
        </button>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <App />
    </Sentry.ErrorBoundary>
    <Toaster />
  </StrictMode>
);
