import axios from 'axios';
import { getStoredToken, handleUnauthorizedSession } from './authSession';
import { toast } from '@/components/hooks/use-toast';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    config.headers = config.headers || {};

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }

    const isFormDataRequest = config.data instanceof FormData;

    if (!isFormDataRequest) {
      config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// USE axiosInstanceAbort WHEN YOU WANNA USE ABORT OR WHEN THE REQUEST REALLY NEEDS IT

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      if (import.meta.env.DEV) {
        console.warn('Request canceled:', error.message);
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      handleUnauthorizedSession();
      return Promise.reject(error);
    }

    if (error.response?.status === 402 && error.response?.data?.error_code === 'LICENSE_EXPIRED') {
      window.dispatchEvent(
        new CustomEvent('LICENSE_EXPIRED', {
          detail: { message: error.response.data.support_message }
        })
      );
      return Promise.reject(error);
    }

    // Feedback global para errores que los handlers locales suelen NO manejar
    // (5xx del servidor, 403 sin permiso). Evita fallos silenciosos donde antes
    // solo había console.error. Un handler que ya muestra su propio error puede
    // saltarlo con config.skipGlobalErrorToast = true.
    const status = error.response?.status;
    const skipToast = (error.config as { skipGlobalErrorToast?: boolean } | undefined)
      ?.skipGlobalErrorToast;
    if (!skipToast) {
      if (status && status >= 500) {
        toast({
          title: 'El servidor tuvo un problema. Intenta de nuevo en un momento.',
          variant: 'destructive'
        });
      } else if (status === 403) {
        toast({ title: 'No tienes permiso para realizar esta acción.', variant: 'destructive' });
      }
    }

    // Error de red pura (sin respuesta del servidor): activar modo offline.
    if (!error.response) {
      import('@/modules/offline/connectivity').then(({ reportNetworkError }) => {
        reportNetworkError();
      });
    }

    return Promise.reject(error);
  }
);

const abortControllerMap = new Map<string, AbortController>();

export const axiosInstanceAbort = async <T>(
  key: string,
  axiosCall: (signal: AbortSignal) => Promise<T>
): Promise<T> => {
  if (abortControllerMap.has(key)) {
    const prevController = abortControllerMap.get(key);
    prevController?.abort();
    abortControllerMap.delete(key);
  }

  const controller = new AbortController();
  abortControllerMap.set(key, controller);

  try {
    return await axiosCall(controller.signal);
  } finally {
    abortControllerMap.delete(key);
  }
};

export default axiosInstance;
