import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { initialState } from './initialState';
import { INewClientResponse, IGetClientsResponse } from './client.types';
import {
  addClient,
  addClientFromInvoice,
  deleteClient,
  editClient,
  getClients
} from '../services/clientsThunks';

export const clientSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Get Clients
      .addCase(getClients.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.status = 'pending';
      })
      .addCase(getClients.fulfilled, (state, action: PayloadAction<IGetClientsResponse>) => {
        state.isLoading = false;
        state.status = 'fulfilled';

        state.clients = action.payload.data;
        state.pagination = {
          currentPage: action.payload.meta.current_page,
          totalPages: action.payload.meta.last_page,
          perPage: action.payload.meta.per_page,
          totalItems: action.payload.meta.total
        };
      })
      .addCase(getClients.rejected, (state) => {
        state.isLoading = false;
        state.error = 'failed';
        state.status = 'rejected';
      })

      // Add Client
      .addCase(addClient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.status = 'pending';
      })
      .addCase(addClient.fulfilled, (state, action: PayloadAction<INewClientResponse>) => {
        state.status = 'fulfilled';
        state.isLoading = false;
        state.clients.push(action.payload);
      })
      .addCase(addClient.rejected, (state) => {
        state.isLoading = false;
        state.error = 'failed';
        state.status = 'rejected';
      })

      // Edit Client
      .addCase(editClient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.status = 'pending';
      })
      .addCase(editClient.fulfilled, (state, action: PayloadAction<INewClientResponse>) => {
        state.isLoading = false;
        const index = state.clients.findIndex((user) => user.id === action.payload.id);
        if (index !== -1) {
          state.clients[index] = action.payload;
        }
        state.status = 'fulfilled';
      })
      .addCase(editClient.rejected, (state) => {
        state.isLoading = false;
        state.error = 'failed';
        state.status = 'rejected';
      })

      // Delete Client
      .addCase(deleteClient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.status = 'pending';
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.isLoading = false;
        state.status = 'fulfilled';

        const id = action.meta.arg;
        state.clients = state.clients.filter((client) => client.id !== id);
      })
      .addCase(deleteClient.rejected, (state) => {
        state.isLoading = false;
        state.error = 'failed';
        state.status = 'rejected';
      })

      .addCase(addClientFromInvoice.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.status = 'pending';
      })
      .addCase(
        addClientFromInvoice.fulfilled,
        (state, action: PayloadAction<INewClientResponse>) => {
          state.isLoading = false;
          state.status = 'fulfilled';

          state.clients.push(action.payload);
        }
      )
      .addCase(addClientFromInvoice.rejected, (state) => {
        state.isLoading = false;
        state.error = 'failed';
        state.status = 'rejected';
      });
  }
});

export default clientSlice.reducer;
