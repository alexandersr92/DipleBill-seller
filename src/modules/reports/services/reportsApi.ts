import axiosInstance from '@/helpers/axiosInstance';
import { IGenerateReportPayload, IGetReportsParams } from '../types';

export const getReportTypesApi = async () => {
  const response = await axiosInstance.get('/v1/reports/types');
  return response.data;
};

export const getReportsApi = async (params: IGetReportsParams) => {
  const response = await axiosInstance.get('/v1/reports', { params });
  return response.data;
};

export const generateReportApi = async (payload: IGenerateReportPayload) => {
  const response = await axiosInstance.post('/v1/reports', payload);
  return response.data;
};

export const downloadReportApi = async (id: string) => {
  const response = await axiosInstance.get(`/v1/reports/${id}/download`, {
    responseType: 'blob'
  });
  return response.data;
};

export const deleteReportApi = async (id: string) => {
  const response = await axiosInstance.delete(`/v1/reports/${id}`);
  return response.data;
};
