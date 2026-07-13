import axios from 'axios';
import { StoreForm } from '@diplebill/core';
import axiosInstance from '../../../helpers/axiosInstance';
import { getStoredToken, handleUnauthorizedSession } from '@/helpers/authSession';

async function registerStore(data: StoreForm): Promise<any> {
  try {
    const res = await axiosInstance.post('/v1/stores', data);
    return res.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 409 && error.response?.data?.message) {
        return { error: error.response.data.message };
      }
    }
    throw new Error('Ha ocurrido un error inesperado');
  }
}

async function updateStore(data: StoreForm, storeId: string): Promise<any> {
  try {
    const response = await axiosInstance.put(`/v1/stores/${storeId}`, data);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 409 && error.response?.data?.message) {
        return { error: error.response.data.message };
      }
    }
    throw new Error('Ha ocurrido un error inesperado');
  }
}

export async function getAllStores(): Promise<any> {
  try {
    const response = await axiosInstance.get('/v1/stores');
    return response.data.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 409 && error.response?.data?.message) {
        return { error: error.response.data.message };
      }
    }
    throw new Error('Ha ocurrido un error inesperado');
  }
}

async function getStoreById(storeId: string, signal?: AbortSignal): Promise<any> {
  try {
    const response = await axiosInstance.get(`/v1/stores/${storeId}`, { signal });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 409 && error.response?.data?.message) {
        return { error: error.response.data.message };
      }
    }
    throw new Error('Ha ocurrido un error inesperado');
  }
}

async function deleteStore(storeId: string): Promise<any> {
  try {
    const response = await axiosInstance.delete(`/v1/stores/${storeId}`);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 409 && error.response?.data?.message) {
        return { error: error.response.data.message };
      }
    }
    throw new Error('Ha ocurrido un error inesperado');
  }
}

async function updateStoreLogo(file: File | null, storeId: string): Promise<any> {
  try {
    const formData = new FormData();
    if (file) {
      formData.append('print_logo', file);
    } else {
      formData.append('print_logo', 'null');
    }

    const response = await axiosInstance.post(`/v1/stores/${storeId}/addImageToStore`, formData, {
      headers: {
        Accept: 'application/json'
      }
    });

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 409 && error.response?.data?.message) {
        return { error: error.response.data.message };
      }

      throw new Error(error.response?.data?.message || 'Ha ocurrido un error inesperado');
    }

    throw new Error('Ha ocurrido un error inesperado');
  }
}

async function fetchProtectedStoreAsset(url: string): Promise<Blob | null> {
  try {
    const token = getStoredToken();
    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });

    if (response.status === 401) {
      handleUnauthorizedSession();
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      return null;
    }

    return await response.blob();
  } catch {
    return null;
  }
}

export {
  registerStore,
  updateStore,
  getStoreById,
  deleteStore,
  updateStoreLogo,
  fetchProtectedStoreAsset
};
