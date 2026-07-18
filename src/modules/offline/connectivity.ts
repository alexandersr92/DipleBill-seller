import axios from 'axios';
import { store } from '@/store/store';
import { setOnline } from './slices/offlineSlice';

const PING_TIMEOUT_MS = 4000;
const RECONNECT_POLL_MS = 10000;

let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

// Axios crudo (sin interceptores): el ping no debe disparar logout ni overlays.
export const verifyConnection = async (): Promise<boolean> => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/v1/ping`, {
      timeout: PING_TIMEOUT_MS
    });
    return response.status === 200;
  } catch {
    return false;
  }
};

const markOnline = () => {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (!store.getState().offlineSlice.isOnline) {
    store.dispatch(setOnline(true));
  }
};

const markOffline = () => {
  if (store.getState().offlineSlice.isOnline) {
    store.dispatch(setOnline(false));
  }
  scheduleReconnectPoll();
};

const scheduleReconnectPoll = () => {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    const ok = await verifyConnection();
    if (ok) {
      markOnline();
    } else {
      scheduleReconnectPoll();
    }
  }, RECONNECT_POLL_MS);
};

// Llamado desde el interceptor de axios ante errores de red pura.
export const reportNetworkError = () => {
  markOffline();
};

// El evento 'online' del navegador puede mentir (portales cautivos, red zombie):
// se confirma con un ping real antes de marcar online.
export const registerConnectivityListeners = () => {
  const onOffline = () => markOffline();
  const onOnline = async () => {
    const ok = await verifyConnection();
    if (ok) {
      markOnline();
    } else {
      scheduleReconnectPoll();
    }
  };

  window.addEventListener('offline', onOffline);
  window.addEventListener('online', onOnline);

  // Chequeo inicial: si el navegador dice online, confirmar contra el backend.
  if (!navigator.onLine) {
    markOffline();
  } else {
    onOnline();
  }

  return () => {
    window.removeEventListener('offline', onOffline);
    window.removeEventListener('online', onOnline);
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };
};
