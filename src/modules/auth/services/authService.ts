import axios from 'axios';
import { AppDispatch, store } from '@/store/store';
import axiosInstance from '@/helpers/axiosInstance';
import { clearStoredSession, getStoredToken } from '@/helpers/authSession';
import { userLogout } from '../slices/userSlice';
import type { IRegisterForm } from '@diplebill/core';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

interface ValidatedUser {
  id: string;
  email: string;
  organization_id: string;
  seller_id?: string | null;
}

interface ValidateTokenResponse {
  valid: boolean;
  user?: ValidatedUser;
}

export type ValidateTokenResult =
  | {
      valid: true;
      user: ValidatedUser;
    }
  | {
      valid: false;
      user: null;
    };

async function login(email: string, password: string): Promise<any> {
  const device_name = 'web';

  try {
    const response = await axios.post(`${apiBaseUrl}/v1/login`, { email, password, device_name });

    if (response.data?.user) {
      localStorage.setItem('cached_user', JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 422) {
        return error.response.data;
      } else {
        throw new Error(error.response?.data?.message || 'Acceso Fallido');
      }
    } else {
      throw new Error('Ha ocurrido un error inesperado');
    }
  }
}

async function registerService(data: IRegisterForm): Promise<any> {
  const device_name = 'web';

  try {
    const response = await axios.post(`${apiBaseUrl}/v1/register`, { ...data, device_name });
    return response.data.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 422) {
        return error.response.data;
      } else {
        throw new Error(error.response?.data?.message || 'Acceso Fallido');
      }
    } else {
      throw new Error('Ha ocurrido un error inesperado');
    }
  }
}

async function logout(token: string) {
  try {
    await axios.post(`${apiBaseUrl}/v1/logout`, null, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  } catch (error) {
    if (error) {
      console.error(error);
    }
  }
}

async function validateToken(token: string): Promise<ValidateTokenResult> {
  try {
    const res = await axiosInstance.get<ValidateTokenResponse>('/v1/validateToken', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.data.valid && res.data.user) {
      localStorage.setItem('cached_user', JSON.stringify(res.data.user));
      return {
        valid: true,
        user: res.data.user
      };
    }

    return {
      valid: false,
      user: null
    };
  } catch (error: any) {
    if (!navigator.onLine || error?.code === 'ERR_NETWORK') {
      const cached = localStorage.getItem('cached_user');
      if (cached) {
        return {
          valid: true,
          user: JSON.parse(cached)
        };
      }
    }

    return {
      valid: false,
      user: null
    };
  }
}

async function sellerLoginService(storeId: string, code: string, pin: string): Promise<any> {
  try {
    const response = await axiosInstance.post('/v1/sellers/seller-login', {
      store_id: storeId,
      code,
      pin
    });
    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 422) {
        return error.response.data;
      } else {
        throw new Error(error.response?.data?.message || 'Acceso Fallido');
      }
    } else {
      throw new Error('Ha ocurrido un error inesperado');
    }
  }
}

async function verifyOwnerPassword(email: string, password: string): Promise<boolean> {
  try {
    const res = await login(email, password);
    return !!(res && !res.message && res.token);
  } catch {
    return false;
  }
}

export { login, logout, registerService, validateToken, sellerLoginService, verifyOwnerPassword };

export const performLogout = () => async (dispatch: AppDispatch) => {
  try {
    const token = store.getState().userSlice.token || getStoredToken();
    if (token) {
      await logout(token);
    }
  } catch {
    // Ignore errors during logout
  }

  clearStoredSession();
  dispatch(userLogout());
};
