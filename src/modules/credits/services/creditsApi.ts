import axiosInstance from '@/helpers/axiosInstance';
import { IMetaRequestParams } from '@/modules/types';
import { ICreditInvoicePayment } from '../types';

export const getAllCreditsApi = async (params: IMetaRequestParams) => {
  const response = await axiosInstance.get(`/v1/credits-by-client`, { params });
  return response.data;
};

export const getCreditInvoicesApi = async (id: string) => {
  const response = await axiosInstance.get(`/v1/credits-by-client/${id}`);
  return response.data;
};

export const getCreditByIdApi = async (id: string) => {
  const response = await axiosInstance.get(`/v1/credits/${id}`);
  return response.data;
};

export const payInvoicesApi = async (invoices: ICreditInvoicePayment) => {
  const response = await axiosInstance.post(`/v1/credits/payment`, invoices);
  return response.data;
};
