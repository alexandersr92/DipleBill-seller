import axiosInstance from '@/helpers/axiosInstance';

export const getCategoriesApi = async () => {
  const response = await axiosInstance.get('/v1/categories');
  return response.data;
};
