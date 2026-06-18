import axiosInstance from '@/helpers/axiosInstance';

interface Inventory {
  id: string;
  name: string;
  store: string;
  store_id: string;
  address: string;
  productsQuantity: number;
}

export const getInventories = async (): Promise<Inventory[]> => {
  try {
    const response = await axiosInstance.get('/v1/inventories');
    return response.data;
  } catch (error) {
    console.error('Error al obtener los inventarios:', error);
    throw error;
  }
};
