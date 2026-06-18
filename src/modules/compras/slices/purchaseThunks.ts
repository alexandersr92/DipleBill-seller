import { createAsyncThunk } from '@reduxjs/toolkit';

import {
  deletePurchaseApi,
  editPurchaseApi,
  getPurchaseByIdApi,
  getPurchasesApi
} from '../services/comprasApi';
import { IComprasProduct, IPurchaseItem } from '../types/compras.types';

export const getPurchases = createAsyncThunk('/purchases/getPurchases', async () => {
  try {
    const data = await getPurchasesApi();
    return data;
  } catch (error) {
    console.error('Error getting inventories:', error);
    return error;
  }
});

export const getPurchaseById = createAsyncThunk('purchases/getPurchaseByID', async (id: string) => {
  try {
    const data = await getPurchaseByIdApi(id);
    return data;
  } catch (error) {
    console.error('Error getting inventory by Id:', error);
    return error;
  }
});

export const editPurchase = createAsyncThunk(
  'purchases/editPurchase',
  async ({ id, purchase }: { id: string; purchase: IPurchaseItem }) => {
    try {
      const data = await editPurchaseApi(id, purchase);
      return data;
    } catch (error) {
      console.error('Error editing purchase:', error);
      return error;
    }
  }
);

export const deletePurchase = createAsyncThunk<IComprasProduct, string>(
  'purchases/deletePurchase',
  async (id, { rejectWithValue }) => {
    if (!id) return rejectWithValue("The id isn't provided!");

    try {
      const data = await deletePurchaseApi(id);
      return data;
    } catch (error) {
      console.error('Error deleting client:', error);
      return rejectWithValue(error);
    }
  }
);
