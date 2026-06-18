import axiosInstance from '@/helpers/axiosInstance';

export interface ISellerStore {
  id: string;
  name: string;
}

export interface ISeller {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'inactive' | 'blocked';
  is_owner: boolean;
  stores?: ISellerStore[];
}

export async function getSellers(): Promise<ISeller[]> {
  const response = await axiosInstance.get('/v1/sellers');
  return response.data.data;
}

export async function createSeller(data: {
  name: string;
  code: string;
  pin: string;
  status?: string;
  stores: string[];
}): Promise<any> {
  const response = await axiosInstance.post('/v1/sellers', data);
  return response.data;
}

export async function updateSeller(
  id: string,
  data: {
    name?: string;
    code?: string;
    pin?: string | null;
    status?: string;
    stores?: string[];
  }
): Promise<any> {
  const response = await axiosInstance.put(`/v1/sellers/${id}`, data);
  return response.data;
}

export async function deleteSeller(id: string): Promise<any> {
  const response = await axiosInstance.delete(`/v1/sellers/${id}`);
  return response;
}
