import axiosInstance from '@/helpers/axiosInstance';

export const getExpenseCategoriesApi = async () => {
  const response = await axiosInstance.get('/v1/expense-categories');
  return response.data;
};

export const createExpenseCategoryApi = async (name: string) => {
  try {
    const response = await axiosInstance.post('/v1/expense-categories', {
      name
    });
    return response.data;
  } catch (error) {
    console.error('Error al crear la categoría de gasto:', error);
    throw error;
  }
};
