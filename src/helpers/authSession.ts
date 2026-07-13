import { store } from '@/store/store';
import { userLogout } from '@/modules/auth/slices/userSlice';

const TOKEN_STORAGE_KEY = 'token';
const LEGACY_SELLER_STORAGE_KEY = 'seller_id';
const CURRENT_STORE_STORAGE_KEY = 'currentStoreId';

let isHandlingUnauthorized = false;

export const getStoredToken = () => localStorage.getItem(TOKEN_STORAGE_KEY);

export const persistSessionToken = (token: string) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  localStorage.removeItem(LEGACY_SELLER_STORAGE_KEY);
};

export const clearStoredSession = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(LEGACY_SELLER_STORAGE_KEY);
  localStorage.removeItem(CURRENT_STORE_STORAGE_KEY);
};

export const handleUnauthorizedSession = () => {
  if (isHandlingUnauthorized) {
    return;
  }

  isHandlingUnauthorized = true;
  clearStoredSession();
  store.dispatch(userLogout());

  if (window.location.hash !== '#/login') {
    window.location.hash = '/login';
  }

  window.setTimeout(() => {
    isHandlingUnauthorized = false;
  }, 0);
};
