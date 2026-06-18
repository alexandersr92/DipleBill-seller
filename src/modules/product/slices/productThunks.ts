import { createAsyncThunk } from '@reduxjs/toolkit';

import axios from 'axios';
import {
  createProductApi,
  deleteProductApi,
  getProductApi,
  getProductByIdApi,
  updateProductApi
} from '../services/productService';
import {
  CreatedProductResponse,
  CreateProductRequest,
  getProductsParams,
  PartialUpdateProductRequest,
  ProductByIdResponse,
  ProductResponse,
  UpdatedProductResponse
} from '../helpers/interfaces';

export const getProducts = createAsyncThunk<ProductResponse, getProductsParams>(
  'product/getProducts',
  async (params, { rejectWithValue }) => {
    console.log(params);
    try {
      const data = await getProductApi(params);
      return data;
    } catch (error) {
      console.error('Error getting products:', error);
      return rejectWithValue(error);
    }
  }
);

export const getProduct = createAsyncThunk<ProductByIdResponse, string>(
  'product/getProduct',
  async (id: string, { rejectWithValue }) => {
    try {
      const data = await getProductByIdApi(id);
      return data;
    } catch (error) {
      console.error('Error getting product:', error);
      return rejectWithValue(error);
    }
  }
);

export const createProduct = createAsyncThunk<CreatedProductResponse, CreateProductRequest>(
  'product/createProduct',
  async (product, { rejectWithValue }) => {
    try {
      const response = await createProductApi(product);
      if (response === undefined || response === null) {
        return rejectWithValue({
          message: 'No se recibió respuesta del servidor',
          errors: {}
        });
      }
      return response;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'errors' in error) {
        const serverError = error as {
          errors: Record<string, string[]>;
          message?: string;
          status?: number;
        };

        const errorMessages = {
          barcode: 'El código de barras ya está en uso',
          sku: 'El SKU ya está en uso',
          name: 'El nombre del producto ya está en uso'
        };

        const translatedErrors: Record<string, string[]> = {};
        Object.entries(serverError.errors).forEach(([key, messages]) => {
          translatedErrors[key] = messages.map((msg) => {
            if (msg.includes('already been taken')) {
              return errorMessages[key as keyof typeof errorMessages] || msg;
            }
            return msg;
          });
        });

        return rejectWithValue({
          message: serverError.message,
          errors: translatedErrors,
          status: serverError.status
        });
      }

      return rejectWithValue({
        message: 'Error desconocido al crear el producto',
        errors: {}
      });
    }
  }
);

export const updateProduct = createAsyncThunk<
  UpdatedProductResponse,
  { id: string; data: PartialUpdateProductRequest }
>('product/updateProduct', async ({ id, data }, { rejectWithValue }) => {
  if (!id) return rejectWithValue('El id no se ha proporcionado!') as any;

  // console.log('data', data);

  try {
    const response = await updateProductApi(id, data);
    return response;
  } catch (error) {
    console.error('Error al actualizar el producto:', error);
    if (axios.isAxiosError(error)) {
      return rejectWithValue({
        message: error.response?.data?.message || 'Error desconocido',
        status: error.response?.status
      });
    }
    return rejectWithValue('Error desconocido al actualizar el producto');
  }
});

export const deleteProduct = createAsyncThunk<string, string>(
  'product/deleteProduct',
  async (id, { rejectWithValue }) => {
    if (!id) return rejectWithValue('El id no se ha proporcionado!');

    try {
      const response = await deleteProductApi(id);
      console.log(response);
      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue({
          message: error.response?.data?.message || 'Error desconocido',
          status: error.response?.status
        });
      }
      return rejectWithValue('Error desconocido al eliminar el producto');
    }
  }
);
