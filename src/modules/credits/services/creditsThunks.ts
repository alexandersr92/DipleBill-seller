import { createAsyncThunk } from '@reduxjs/toolkit';
import { getAllCreditsApi, getCreditByIdApi, getCreditInvoicesApi, payInvoicesApi } from './creditsApi';
import { ICredit, ICreditInvoicePayment, IGetCreditByClientResponse, IGetCreditResponse, IGetCreditsResponse } from '../types';
import { IMetaRequestParams } from '@/modules/types';

export const getCredits = createAsyncThunk<IGetCreditsResponse, IMetaRequestParams>(
  'credits/getAllCredits',
  async (params, { rejectWithValue }) => {
    try {
      const data = await getAllCreditsApi(params);
      return data;
    } catch (error) {
      console.error('Error getting all credits from credits module:', error);
      return rejectWithValue(error);
    }
  }
);

export const getCreditClientById = createAsyncThunk<IGetCreditByClientResponse, string>(
  'credits/getCreditClientById',
  async (id, { rejectWithValue }) => {
    try {
      const data = await getCreditInvoicesApi(id);
      return data;
    } catch (error) {
      console.error('Error getting credits from credits module:', error);
      return rejectWithValue(error);
    }
  }
);

export const getCreditById = createAsyncThunk<IGetCreditResponse, string>(
  'credits/getCreditById',
  async (id, { rejectWithValue }) => {
    try {
      const data = await getCreditByIdApi(id);
      return data;
    } catch (error) {
      console.error('Error getting credits from credits module:', error);
      return rejectWithValue(error);
    }
  }
);

export const payCredit = createAsyncThunk<ICredit[], ICreditInvoicePayment>(
  'credits/payCredit',
  async (payment, { rejectWithValue }) => {
    try {
      const data = await payInvoicesApi(payment);
      return data;
    } catch (error) {
      console.error('Error getting credits from credits module:', error);
      return rejectWithValue(error);
    }
  }
);