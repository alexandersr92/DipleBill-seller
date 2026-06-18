import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import {
  addInventoryApi,
  addProductsToInventoryApi,
  deleteInventoryApi,
  editInventoryApi,
  getInventoriesApi,
  getInventoryByIdApi,
  getInventoryProductsApi
} from './inventoryApi';

import { TInventory, IInventoryPreview, EditInventoryData, IAddInventory } from '../types';
import { IInventoryMetaRequestParams, IMetaRequestParams } from '@/modules/types';
import { ISingleInventory } from '../slices/initialState';

export const getInventories = createAsyncThunk<IInventoryPreview[], IInventoryMetaRequestParams>(
  'inventory/getInventories',
  async (params, { rejectWithValue }) => {
    try {
      const data = await getInventoriesApi(params);
      return data;
    } catch (error) {
      console.error('Error getting inventories:', error);
      return rejectWithValue(error);
    }
  }
);

export const getInventoryById = createAsyncThunk<TInventory, string>(
  'inventory/getInventoryById',
  async (id, { rejectWithValue }) => {
    try {
      const data = await getInventoryByIdApi(id);
      return data;
    } catch (error) {
      console.error('Error getting inventory by Id:', error);
      return rejectWithValue(error);
    }
  }
);

export const addInventory = createAsyncThunk<IAddInventory, IAddInventory>(
  'inventory/addInventory',
  async (inventory, { rejectWithValue }) => {
    try {
      const data = await addInventoryApi(inventory);
      return data;
    } catch (error) {
      console.error('Error adding new inventory:', error);
      return rejectWithValue(error);
    }
  }
);

export const addProductsToInventory = createAsyncThunk<
  void,
  { inventoryId: string; products: string[] }
>('inventory/addProductsToInventory', async ({ inventoryId, products }, { rejectWithValue }) => {
  try {
    const data = await addProductsToInventoryApi(inventoryId, products);
    return data;
  } catch (error) {
    console.error('Error adding products to inventory:', error);
    return rejectWithValue(error);
  }
});

export const editInventory = createAsyncThunk<EditInventoryData, EditInventoryData>(
  'inventory/editInventory',
  async ({ id, ...newData }, { rejectWithValue }) => {
    if (!id) return rejectWithValue("The id isn't provided!");

    try {
      const data = await editInventoryApi(id, newData);
      return data;
    } catch (error) {
      console.error('Error editing inventory:', error);
      return rejectWithValue(error);
    }
  }
);

export const deleteInventory = createAsyncThunk<void, string>(
  'inventory/deleteInventory',
  async (id, { rejectWithValue }) => {
    if (!id) return rejectWithValue("The id isn't provided!");

    try {
      const data = await deleteInventoryApi(id);
      return data;
    } catch (error) {
      console.error('Error deleting client:', error);
      return rejectWithValue(error);
    }
  }
);

export const getInventoryProducts = createAsyncThunk<
  ISingleInventory,
  { id: string; params: IMetaRequestParams }
>('inventories/getInventoryProducts', async ({ id, params }, { rejectWithValue }) => {
  try {
    const response = await getInventoryProductsApi(id, params);
    return response;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      return rejectWithValue(error.response?.data || 'Error fetching inventory products');
    }
    return rejectWithValue('Error fetching inventory products');
  }
});
