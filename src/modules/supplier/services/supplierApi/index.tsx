import axiosInstance from '@/helpers/axiosInstance';

type Params = {
  per_page: number;
  sort: string;
  search: string;
  search_by: string;
  order: 'asc' | 'desc';
  page: number;
};

type SupplierContact = {
  name: string;
  email: string;
  phone: string;
  notes?: string;
};

type SupplierCreateData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state?: string;
  country?: string;
  notes?: string;
  contacts?: SupplierContact[];
};

type SupplierUpdateData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  notes?: string;
};

export const getSuppliersApi = async (params: Params) => {
  const response = await axiosInstance.get('/v1/suppliers', { params });
  return response.data;
};

export const getSupplierByIdApi = async (id: string) => {
  const response = await axiosInstance.get(`/v1/suppliers/${id}`);
  return response.data;
};

export const createSupplierApi = async (data: SupplierCreateData) => {
  const response = await axiosInstance.post('/v1/suppliers', data);
  return response.data;
};

export const updateSupplierApi = async (id: string, data: SupplierUpdateData) => {
  const response = await axiosInstance.put(`/v1/suppliers/${id}`, data);
  return response.data;
};

export const deleteSupplierApi = async (id: string) => {
  await axiosInstance.delete(`/v1/suppliers/${id}`);
  return id;
};
