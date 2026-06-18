import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  createSupplierApi,
  deleteSupplierApi,
  getSupplierByIdApi,
  getSuppliersApi,
  updateSupplierApi
} from '../supplierApi';
import axios from 'axios';
import {
  CreatedSupplierResponse,
  CreateSupplierRequest,
  getSuppliersParams,
  SupplierByIdResponse,
  SupplierResponse,
  UpdatedSupplierResponse
} from '../../helpers/interfaces';

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

export const getSuppliers = createAsyncThunk<
  SupplierResponse,
  getSuppliersParams & { getAll?: boolean }
>('supplier/getSuppliers', async (params, { rejectWithValue }) => {
  try {
    const data = await getSuppliersApi(params);
    return data;
  } catch (error) {
    console.error('Error getting suppliers:', error);
    return rejectWithValue(error);
  }
});

export const getSupplier = createAsyncThunk<SupplierByIdResponse, string>(
  'supplier/getSupplier',
  async (id: string, { rejectWithValue }) => {
    try {
      const data = await getSupplierByIdApi(id);
      console.log(data);
      return data;
    } catch (error) {
      console.error('Error getting supplier:', error);
      return rejectWithValue(error);
    }
  }
);

export const createSupplier = createAsyncThunk<CreatedSupplierResponse, CreateSupplierRequest>(
  'supplier/createSupplier',
  async (supplier, { rejectWithValue }) => {
    try {
      const data = await createSupplierApi(supplier);
      return data;
    } catch (error) {
      console.error('Error creating supplier:', error);
      return rejectWithValue(error);
    }
  }
);

export const updateSupplier = createAsyncThunk<
  UpdatedSupplierResponse,
  { id: string; data: SupplierUpdateData }
>('supplier/updateSupplier', async ({ id, data }, { rejectWithValue }) => {
  if (!id) return rejectWithValue('El id no se ha proporcionado!');

  try {
    const response = await updateSupplierApi(id, data);
    console.log(response);
    return response;
  } catch (error) {
    console.error('Error al actualizar el proveedor:', error);
    if (axios.isAxiosError(error)) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Error desconocido',
        status: error.response?.status
      });
    }
    return rejectWithValue('Error desconocido al actualizar el proveedor');
  }
});

export const deleteSupplier = createAsyncThunk<string, string>(
  'supplier/deleteSupplier',
  async (id, { rejectWithValue }) => {
    if (!id) return rejectWithValue('El id no se ha proporcionado!');

    try {
      const response = await deleteSupplierApi(id);
      console.log(response);
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue({
          message: error.response?.data?.message || 'Error desconocido',
          status: error.response?.status
        });
      }
      return rejectWithValue('Error desconocido al eliminar el proveedor');
    }
  }
);
