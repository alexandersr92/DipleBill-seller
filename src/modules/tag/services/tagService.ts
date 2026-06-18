import axiosInstance from '@/helpers/axiosInstance';

export const getTagsApi = async () => {
  const response = await axiosInstance.get('/v1/tags');
  return response.data;
};
