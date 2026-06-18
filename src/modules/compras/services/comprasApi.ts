import axios from 'axios';
import axiosInstance from '@/helpers/axiosInstance';
import { IComprasProductResponse, IPurchaseItem } from '../types/compras.types';

export const uploadFile = async (fileProp: File): Promise<IComprasProductResponse> => {
  const formData = new FormData();
  formData.append('file', fileProp);

  try {
    const response = await axiosInstance.post<IComprasProductResponse>('/v1/purchases/upload', formData, {
      headers: {
        Accept: 'application/json'
      }
    });

    return response.data;
  } catch (error: any) {
    console.error('Upload error:', error.response?.data || error.message);
    throw error;
  }
};

export const createCompra = async (data: any): Promise<string> => {
  try {
    const response = await axiosInstance.post<string>(`v1/purchases`, data);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Create compra error:', error.response?.data || error.message);
    }
    throw error;
  }
};

export const getPurchasesApi = async (): Promise<any> => {
  try {
    const response = await axiosInstance.get(`v1/purchases`);
    return response;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Get purchases error:', error.response?.data || error.message);
    }
    throw error;
  }
};
export const getPurchaseByIdApi = async (id: string): Promise<any> => {
  try {
    const response = await axiosInstance.get(`v1/purchases/${id}`);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Get purchase by Id error:', error.response?.data || error.message);
    }
    throw error;
  }
};
export const editPurchaseApi = async (id: string, purchase: IPurchaseItem): Promise<any> => {
  try {
    const response = await axiosInstance.put(`v1/purchases/${id}`, purchase);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Edit purchase error:', error.response?.data || error.message);
    }
    throw error;
  }
};
export const deletePurchaseApi = async (id: string): Promise<any> => {
  try {
    const response = await axiosInstance.delete(`v1/purchases/${id}`);

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Delete purchase error:', error.response?.data || error.message);
    }
    throw error;
  }
};
