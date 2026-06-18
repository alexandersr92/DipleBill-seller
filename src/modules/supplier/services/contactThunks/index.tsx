import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  getContactsApi,
  createContactApi,
  updateContactApi,
  deleteContactApi
} from '../contactApi';
import {
  CreateContactSupplierResponse,
  GetContactsResponse,
  UpdatedContactResponse
} from '../../helpers/interfaces';

export const getContacts = createAsyncThunk<GetContactsResponse, string>(
  'contact/getContacts',
  async (supplierId, { rejectWithValue }) => {
    try {
      const data = await getContactsApi(supplierId);
      return data;
    } catch (error) {
      console.error('Error obteniendo contactos:', error);
      return rejectWithValue(error);
    }
  }
);

export const createContact = createAsyncThunk<
  CreateContactSupplierResponse,
  { supplierId: string; contact: ContactForm }
>('contact/createContact', async ({ supplierId, contact }, { rejectWithValue }) => {
  try {
    const data = await createContactApi(supplierId, contact);
    console.log(data);
    return data;
  } catch (error) {
    console.error('Error creando contacto:', error);
    return rejectWithValue(error);
  }
});

export const updateContact = createAsyncThunk<
  UpdatedContactResponse,
  { supplierId: string; contact: ContactForm }
>('contact/updateContact', async ({ supplierId, contact }, { rejectWithValue }) => {
  if (!contact.id) return rejectWithValue('¡No se proporcionó el id del contacto!');

  try {
    const data = await updateContactApi(supplierId, contact);
    console.log(data);
    return data;
  } catch (error) {
    console.error('Error actualizando contacto:', error);
    return rejectWithValue(error);
  }
});

export const deleteContact = createAsyncThunk<string, { supplierId: string; contactId: string }>(
  'contact/deleteContact',
  async ({ supplierId, contactId }, { rejectWithValue }) => {
    if (!contactId) return rejectWithValue('¡No se proporcionó el id del contacto!');

    try {
      const data = await deleteContactApi(supplierId, contactId);
      console.log(data);
      return data;
    } catch (error) {
      console.error('Error eliminando contacto:', error);
      return rejectWithValue(error);
    }
  }
);
