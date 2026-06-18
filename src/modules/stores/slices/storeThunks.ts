import { createAsyncThunk } from '@reduxjs/toolkit';
import { deleteStore, getAllStores, getStoreById } from '../services/storeService';

export const fetchStores = createAsyncThunk('store/fetchStores', async (_, { rejectWithValue }) => {
  try {
    const response = await getAllStores();
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching stores';
    return rejectWithValue(message);
  }
});

export const fetchCurrentStore = createAsyncThunk(
  'store/fetchStore',
  async (storeId: string, { rejectWithValue }) => {
    try {
      const store = await getStoreById(storeId);
      return store.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error fetching store';
      return rejectWithValue(message);
    }
  }
);

export const deleteStoreThunk = createAsyncThunk(
  'store/DeleteStore',
  async (storeId: string, { rejectWithValue }) => {
    try {
      const store = await deleteStore(storeId);
      return store.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error fetching stores';
      return rejectWithValue(message);
    }
  }
);
