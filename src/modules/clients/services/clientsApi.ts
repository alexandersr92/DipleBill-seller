import axiosInstance from '@/helpers/axiosInstance';
import { ISingleClient, IUpdatedClient } from '../types';
import { getClientsParams } from '../slices/client.types';

export const getClientsApi = async (params: getClientsParams) => {
  const response = await axiosInstance.get(`/v1/clients`, { params });
  return response.data;
};

export const getClientByIdApi = async ({ id = '' }) => {
  const response = await axiosInstance.get(`/v1/clients/${id}`);
  return response.data;
};

export const addClientApi = async (client: ISingleClient) => {
  const response = await axiosInstance.post(`/v1/clients`, client);
  return response.data;
};

export const editClientApi = async (id: string, client: IUpdatedClient) => {
  const response = await axiosInstance.put(`/v1/clients/${id}`, client);
  return response.data;
};

export const deleteClientApi = async (id: string) => {
  const response = await axiosInstance.delete(`/v1/clients/${id}`);
  return response.data;
};

interface IClientRequiredData {
  name: string;
  stores: string[];
  wholesaler: boolean;
}

export const addNewClientFromInvoiceApi = async (data: IClientRequiredData) => {
  const response = await axiosInstance.post(`/v1/clients`, data);
  return response.data;
};
