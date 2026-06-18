import axiosInstance from '@/helpers/axiosInstance';

export const getContactsApi = async (supplierId: string) => {
  const response = await axiosInstance.get(`/v1/suppliers/${supplierId}/contacts`);
  return response.data;
};

export const createContactApi = async (supplierId: string, contact: ContactForm) => {
  const response = await axiosInstance.post(`/v1/suppliers/${supplierId}/contacts`, contact);
  return response.data;
};

export const updateContactApi = async (supplierId: string, contact: ContactForm) => {
  const response = await axiosInstance.put(
    `/v1/suppliers/${supplierId}/contacts/${contact.id}`,
    contact
  );
  return response.data;
};

export const deleteContactApi = async (supplierId: string, contactId: string) => {
  await axiosInstance.delete(`/v1/suppliers/${supplierId}/contacts/${contactId}`);
  return contactId;
};
