import * as Sentry from '@sentry/react';

// Monitoreo de errores. Queda inerte si no hay VITE_SENTRY_DSN definido, así
// que no afecta a desarrollo ni a entornos sin configurar. Para activarlo,
// crea un proyecto en sentry.io y define VITE_SENTRY_DSN en el build de producción.
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Muestreo de trazas de rendimiento (ajustable). Los errores se capturan al 100%.
    tracesSampleRate: 0.1,
    // No enviar errores durante el desarrollo local.
    enabled: import.meta.env.PROD
  });
}
