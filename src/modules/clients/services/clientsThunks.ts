import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  addClientApi,
  addNewClientFromInvoiceApi,
  deleteClientApi,
  editClientApi,
  getClientByIdApi,
  getClientsApi
} from './clientsApi';
import {
  IGetClientByIdResponse,
  IGetClientsResponse,
  INewClientResponse,
  IUpdatedClientResponse,
  TGetClientByIdParams,
  getClientsParams
} from '../slices/client.types';
import { ISingleClient, IUpdatedClient } from '@diplebill/core';
import axios from 'axios';
import { getClientsFromCache, mirrorClientsToCache } from '@/modules/offline/clientsCache';

export const getClients = createAsyncThunk<IGetClientsResponse, getClientsParams>(
  'clients/getClients',
  async (params, { rejectWithValue }) => {
    try {
      const data = await getClientsApi(params);
      // Espejo al caché offline (fire-and-forget: no bloquea la respuesta).
      mirrorClientsToCache(data?.data ?? []);
      return data;
    } catch (error) {
      // Sin red: responder desde el caché offline con la misma forma.
      if (axios.isAxiosError(error) && !error.response) {
        const cached = await getClientsFromCache();
        if (cached.length > 0) {
          return {
            data: cached,
            meta: {
              per_page: cached.length,
              total: cached.length,
              current_page: 1,
              last_page: 1
            }
          };
        }
      }
      console.error('Error getting clients:', error);
      return rejectWithValue(error);
    }
  }
);

export const getClientById = createAsyncThunk<IGetClientByIdResponse, TGetClientByIdParams>(
  'clients/getClientById',
  async (id, { rejectWithValue }) => {
    try {
      const data = await getClientByIdApi(id);
      return data;
    } catch (error) {
      console.error('Error getting client by Id:', error);
      return rejectWithValue(error);
    }
  }
);

export const addClient = createAsyncThunk<INewClientResponse, ISingleClient>(
  'clients/addClient',
  async (client, { rejectWithValue }) => {
    try {
      const data = await addClientApi(client);
      return data;
    } catch (error) {
      console.error('Error adding client:', error);
      return rejectWithValue(error);
    }
  }
);

export const editClient = createAsyncThunk<IUpdatedClientResponse, IUpdatedClient>(
  'clients/editClient',
  async ({ id, ...client }, { rejectWithValue }) => {
    if (!id) return rejectWithValue("The id isn't provided!");

    try {
      const data = await editClientApi(id, client);
      return data;
    } catch (error) {
      console.error('Error editing client:', error);
      return rejectWithValue(error);
    }
  }
);

export const deleteClient = createAsyncThunk<void, string>(
  'clients/deleteClient',
  async (id, { rejectWithValue }) => {
    if (!id) return rejectWithValue("The id isn't provided!");

    try {
      const data = await deleteClientApi(id);
      return data;
    } catch (error) {
      console.error('Error deleting client:', error);
      return rejectWithValue(error);
    }
  }
);

interface IAddClientData {
  name: string;
  wholesaler: boolean;
  stores: string[];
}

export const addClientFromInvoice = createAsyncThunk<INewClientResponse, IAddClientData>(
  'clients/addClientFromInvoice',
  async (client, { rejectWithValue }) => {
    try {
      const data = await addNewClientFromInvoiceApi(client);
      return data;
    } catch (error) {
      console.error('Error adding client:', error);
      return rejectWithValue(error);
    }
  }
);
