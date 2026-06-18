import { createAsyncThunk } from '@reduxjs/toolkit';
import { cancelInvoiceById, createBillingApi, getInvoices } from './billingApi';
import { IGetInvoiceResponse, IGetSingleInvoiceResponse, IInvoices } from '../types';
import { IMetaRequestParams } from '@/modules/types';

export const createBilling = createAsyncThunk<IGetSingleInvoiceResponse, IInvoices>(
  'billing/createBilling',
  async (billing, { rejectWithValue }) => {
    try {
      const data = await createBillingApi(billing);
      return data;
    } catch (error) {
      console.error('Error adding invoice:', error);
      return rejectWithValue(error);
    }
  }
);

export const getAllInvoices = createAsyncThunk<IGetInvoiceResponse, IMetaRequestParams>(
  'billing/getAllInvoices',
  async (params, { rejectWithValue }) => {
    try {
      const data = await getInvoices(params);
      return data;
    } catch (error) {
      console.error('Error getting all invoices from billing module:', error);
      return rejectWithValue(error);
    }
  }
);

export const cancelInvoice = createAsyncThunk<void, string>(
  'billing/cancelInvoice',
  async (id, { rejectWithValue }) => {
    if (!id) return rejectWithValue("The id isn't provided!");

    try {
      const data = await cancelInvoiceById(id);
      return data;
    } catch (error) {
      console.error('Error deleting client:', error);
      return rejectWithValue(error);
    }
  }
);
