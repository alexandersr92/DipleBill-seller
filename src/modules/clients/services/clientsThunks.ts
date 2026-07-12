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

export const getClients = createAsyncThunk<IGetClientsResponse, getClientsParams>(
  'clients/getClients',
  async (params, { rejectWithValue }) => {
    try {
      const data = await getClientsApi(params);
      return data;
    } catch (error) {
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
