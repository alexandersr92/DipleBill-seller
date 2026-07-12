import axiosInstance from '@/helpers/axiosInstance';
import { IInvoice } from '@diplebill/core';
import { IMetaRequestParams } from '@diplebill/core';

export const getBillingProductsApi = async ({
  search = '',
  storeId = '',
  search_by = ''
}: {
  search?: string;
  storeId?: string;
  search_by?: string;
}) => {
  let query = '';
  if (storeId) {
    query = `/v1/inventories/stores/${storeId}`;
  } else {
    query = '/v1/products';
  }

  const params: { search: string; search_by?: string } = { search };
  if (search_by) {
    params.search_by = search_by;
  }

  const response = await axiosInstance.get(query, {
    params
  });
  return response.data;
};

export const getBillingProductsByIdApi = async (id: string, inventoryId: string) => {
  const response = await axiosInstance.get(`/v1/inventories/${inventoryId}products/${id}`);
  return response.data;
};

export const getBillingProductsSearchApi = async ({
  page = 1,
  perPage = 100,
  search = '',
  search_by = '',
  inventoryId = ''
}) => {
  const response = await axiosInstance.get(`/v1/inventories/${inventoryId}/products`, {
    params: {
      search_by,
      search,
      page,
      per_page: perPage
    }
  });
  return response.data;
};

export const createBillingApi = async (billing: IInvoice) => {
  const response = await axiosInstance.post(`/v1/invoices`, billing);
  return response.data;
};

export const getInvoices = async (params: IMetaRequestParams) => {
  const response = await axiosInstance.get(`/v1/invoices`, { params });
  return response.data;
};

export const getInvoiceById = async (id: string) => {
  const response = await axiosInstance.get(`/v1/invoices/${id}`);
  return response.data;
};

export const cancelInvoiceById = async (id: string) => {
  const response = await axiosInstance.delete(`/v1/invoices/${id}`);
  return response.data;
};

export const replaceInvoiceApi = async (id: string, billing: IInvoice) => {
  const response = await axiosInstance.post(`/v1/invoices/${id}/replace`, billing);
  return response.data;
};

export const getStoreLogoAsBase64 = async (store_id: string) => {
  const response = await axiosInstance.get(`/v1/stores/${store_id}/printLogo`);
  if (response.data) {
    return response.data.base64;
  }

  return '';
};
