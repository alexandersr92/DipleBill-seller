import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  deleteReportApi,
  downloadReportApi,
  generateReportApi,
  getReportsApi,
  getReportTypesApi
} from './reportsApi';
import { IGenerateReportPayload, IGetReportsParams, IGetReportsResponse } from '../types';

export const getReportTypes = createAsyncThunk<string[], void>(
  'reports/getReportTypes',
  async (_, { rejectWithValue }) => {
    try {
      const data = await getReportTypesApi();
      if (data.types) {
        return data.types.map((t: string | { value: string }) =>
          typeof t === 'string' ? t : t.value
        );
      }
      return data;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error getting report types:', error);
      return rejectWithValue(error);
    }
  }
);

export const getReports = createAsyncThunk<IGetReportsResponse, IGetReportsParams>(
  'reports/getReports',
  async (params, { rejectWithValue }) => {
    try {
      const data = await getReportsApi(params);
      return data;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error getting reports:', error);
      return rejectWithValue(error);
    }
  }
);

export const generateReport = createAsyncThunk<void, IGenerateReportPayload>(
  'reports/generateReport',
  async (payload, { rejectWithValue }) => {
    try {
      await generateReportApi(payload);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error generating report:', error);
      return rejectWithValue(error);
    }
  }
);

export const downloadReport = createAsyncThunk<void, { id: string; name: string }>(
  'reports/downloadReport',
  async ({ id, name }, { rejectWithValue }) => {
    try {
      const blob = await downloadReportApi(id);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error downloading report:', error);
      return rejectWithValue(error);
    }
  }
);

export const deleteReport = createAsyncThunk<string, string>(
  'reports/deleteReport',
  async (id, { rejectWithValue }) => {
    try {
      await deleteReportApi(id);
      return id;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error deleting report:', error);
      return rejectWithValue(error);
    }
  }
);
