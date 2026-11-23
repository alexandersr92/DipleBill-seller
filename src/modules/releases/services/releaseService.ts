import axiosInstance from '@/helpers/axiosInstance';
import { IProductReleaseResponse } from '../types/release.types';

export const getReleases = async (page = 1, perPage = 15): Promise<IProductReleaseResponse> => {
  const response = await axiosInstance.get<IProductReleaseResponse>('/v1/releases', {
    params: { page, per_page: perPage }
  });
  return response.data;
};
