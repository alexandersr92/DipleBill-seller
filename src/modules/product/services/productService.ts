import axiosInstance from '@/helpers/axiosInstance';
import {
  CreateProductRequest,
  getProductsParams,
  PartialUpdateProductRequest
} from '../helpers/interfaces';
import axios from 'axios';

export const getProductApi = async (params: getProductsParams) => {
  const response = await axiosInstance.get('/v1/products', { params });
  return response.data;
};

export const getProductByIdApi = async (id: string) => {
  const response = await axiosInstance.get(`/v1/products/${id}`);
  return response.data;
};

export const createProductApi = async (data: CreateProductRequest) => {
  try {
    const newData = {
      suppliers: data.suppliers,
      sku: data.sku,
      tags: data.tags,
      min_stock: data.min_stock.toString(),
      price: data.price,
      image: data.image,
      description: data.description,
      unit_of_measure: data.unit_of_measure,
      barcode: data.barcode,
      categories: data.categories,
      name: data.name,
      inventories: data.inventories,
      cost: data.cost
    };

    const formData = new FormData();

    Object.entries(newData).forEach(([key, value]) => {
      if (key === 'image' && value instanceof File) {
        formData.append(key, value, value.name);
      } else if (key === 'tags' || key === 'categories' || key === 'suppliers') {
        formData.append(key, Array.isArray(value) ? value.join(',') : String(value));
      } else if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    const response = await axiosInstance.post('/v1/products', formData, {
      headers: {
        Accept: 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data;
      throw {
        message: errorData.message,
        errors: errorData.errors,
        status: error.response.status
      };
    }
    throw error;
  }
};

export const updateProductApi = async (id: string, data: PartialUpdateProductRequest) => {
  try {
    console.log('data', data);
    const response = await axiosInstance.put(`/v1/products/${id}`, data);
    console.log('response', response);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar el producto:', error);
    throw error;
  }
};

export const deleteProductApi = async (id: string) => {
  await axiosInstance.delete(`/v1/products/${id}`);
  return id;
};

export const handleProductImage = async (file: File, productId: string): Promise<boolean> => {
  try {
    await axiosInstance.delete(`/v1/products/${productId}/removeImage`);

    const formData = new FormData();
    formData.append('image', file);

    await axiosInstance.post(`/v1/products/${productId}/addImageToProduct`, formData, {
      headers: {
        Accept: 'application/json'
      }
    });

    return true;
  } catch (error) {
    console.error('Error al manejar la imagen del producto:', error);
    throw error;
  }
};

export const deleteProductImage = async (productId: string): Promise<boolean> => {
  try {
    await axiosInstance.delete(`/v1/products/${productId}/removeImage`);
    return true;
  } catch (error) {
    console.error('Error al eliminar la imagen del producto:', error);
    throw error;
  }
};
