import { createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
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
      if (!navigator.onLine) {
        const normalized = (params.search || '').toLowerCase();
        let localClients = await db.clients.toArray();
        
        if (normalized) {
            localClients = localClients.filter(c => 
                c.name.toLowerCase().includes(normalized) || 
                (c.document && c.document.toLowerCase().includes(normalized))
            );
        }
        
        return {
           data: localClients.map(c => ({
              ...c.raw_data,
              id: c.id,
              name: c.name,
              document: c.document || '',
              document_type: c.document_type || ''
           })),
           total: localClients.length,
           per_page: params.per_page || 10,
           current_page: params.page || 1,
           last_page: 1,
           first_page_url: '',
           last_page_url: '',
           next_page_url: null,
           prev_page_url: null,
           path: '',
           from: 1,
           to: localClients.length
        } as unknown as IGetClientsResponse;
      }

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
      if (!navigator.onLine) {
        const fakeId = uuidv4();
        const newClient = {
           id: fakeId,
           name: client.name,
           email: null,
           phone: null,
           document: null,
           document_type: null,
           raw_data: {
              id: fakeId,
              name: client.name,
              wholesaler: client.wholesaler,
              stores: client.stores,
           },
           is_synced: false
        };
        await db.clients.add(newClient);
        await db.sync_queue.add({
           id: uuidv4(),
           action: 'CREATE_CLIENT',
           payload: { ...client, temp_id: fakeId }, // temp_id helps link it back if needed
           status: 'pending',
           created_at: Date.now()
        });
        return newClient.raw_data as unknown as INewClientResponse;
      }

      const data = await addNewClientFromInvoiceApi(client);
      return data;
    } catch (error) {
      console.error('Error adding client:', error);
      return rejectWithValue(error);
    }
  }
);
