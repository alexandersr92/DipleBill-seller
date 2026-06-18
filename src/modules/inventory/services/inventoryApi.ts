import { IInventoryMetaRequestParams, IMetaRequestParams } from '@/modules/types';
import { IEditInventory, IAddInventory } from '../types';
import axiosInstance from '@/helpers/axiosInstance';

export const getInventoriesApi = async (params: IInventoryMetaRequestParams) => {
  const response = await axiosInstance.get(`/v1/inventories`, { params });
  return response.data;
};

export const getInventoryByIdApi = async (id = '') => {
  if (!id) return new Error('ID not provided');

  const response = await axiosInstance.get(`/v1/inventories/${id}`);
  return response.data;
};

export const addInventoryApi = async (inventory: IAddInventory) => {
  const response = await axiosInstance.post(`/v1/inventories`, inventory);
  return response.data;
};

export const addProductsToInventoryApi = async (inventoryId: string, products: string[]) => {
  const response = await axiosInstance.post(`/v1/inventories/${inventoryId}/addProducts`, products);
  return response.data;
};

export const editInventoryApi = async (id: string, data: IEditInventory) => {
  if (!id) return new Error('ID not provided');
  if (!data) return new Error('Inventory data not provided');

  const response = await axiosInstance.put(`/v1/inventories/${id}`, data);
  return response.data;
};

export const deleteInventoryApi = async (id: string) => {
  if (!id) return new Error('ID not provided');

  const response = await axiosInstance.delete(`/v1/inventories/${id}`);
  return response.data;
};

export const getInventoryProductsApi = async (id: string, params: IMetaRequestParams) => {
  const response = await axiosInstance.get(`/v1/inventories/${id}`, { params });
  return response.data;
};

export const getInventoryProductByIdApi = async (id: string) => {
  const response = await axiosInstance.get(`/v1/products/${id}`);
  return response.data;
};

export const exportInventoryApi = async (params: any) => {
  const response = await axiosInstance.get(`/v1/inventories/export`, {
    params,
    responseType: 'blob'
  });
  return response.data;
};
