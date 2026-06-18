import { OrgForm } from '../components/OrgForm';
import axios from 'axios';
import axiosInstance from '@/helpers/axiosInstance';

async function regisgterOrg(data: OrgForm): Promise<any> {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('email', data.email);
  formData.append('phone', data.phone);
  formData.append('description', data.description);
  formData.append('status', 'active');
  if (data.website) formData.append('website', data.website);
  if (data.logo instanceof File) formData.append('logo', data.logo);

  try {
    const response = await axiosInstance.post('/v1/organizations', formData, {
      headers: {
        Accept: 'application/json'
      }
    });

    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Acceso Fallido');
    }

    throw new Error('Ha ocurrido un error inesperado');
  }
}

export { regisgterOrg };
