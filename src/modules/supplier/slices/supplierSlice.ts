import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { initialState } from './initialState';
import {
  createSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier
} from '../services/supplierThunks';
import {
  CreatedSupplierResponse,
  SupplierResponse,
  UpdatedSupplierResponse
} from '../helpers/interfaces';
import { createContact, deleteContact } from '../services/contactThunks';

export const supplierSlice = createSlice({
  name: 'suppliers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getSuppliers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.status = 'pending';
      })
      .addCase(getSuppliers.fulfilled, (state, action: PayloadAction<SupplierResponse>) => {
        state.isLoading = false;
        state.status = 'fulfilled';
        state.suppliers = action.payload.data;
        state.pagination = {
          currentPage: action.payload.meta.current_page,
          totalPages: action.payload.meta.last_page,
          totalItems: action.payload.meta.total,
          itemsPerPage: action.payload.meta.per_page
        };
      })
      .addCase(getSuppliers.rejected, (state, action) => {
        state.isLoading = false;
        state.status = 'rejected';
        state.error = action.error.message || 'Error al cargar los proveedores';
      })
      .addCase(
        createSupplier.fulfilled,
        (state, action: PayloadAction<CreatedSupplierResponse>) => {
          const newSupplier: SupplierData = {
            id: action.payload.id,
            name: action.payload.name,
            city: action.payload.city,
            state: action.payload.state,
            status: action.payload.status,
            contact_count: action.payload.contacts.length,
            created_at: action.payload.created_at,
            updated_at: action.payload.updated_at
          };
          state.suppliers.push(newSupplier);
        }
      )
      .addCase(updateSupplier.pending, (state) => {
        state.isLoading = true;
        state.status = 'pending';
      })
      .addCase(
        updateSupplier.fulfilled,
        (state, action: PayloadAction<UpdatedSupplierResponse>) => {
          state.isLoading = false;
          state.status = 'fulfilled';
          const index = state.suppliers.findIndex((supplier) => supplier.id === action.payload.id);
          if (index !== -1) {
            state.suppliers[index] = {
              id: action.payload.id,
              name: action.payload.name,
              city: action.payload.city,
              state: action.payload.state,
              status: action.payload.status,
              contact_count: action.payload.contacts.length,
              created_at: action.payload.created_at,
              updated_at: action.payload.updated_at
            };
          }
        }
      )
      .addCase(updateSupplier.rejected, (state, action) => {
        state.isLoading = false;
        state.status = 'rejected';
        state.error = action.error.message || 'Error al actualizar el proveedor';
      })
      .addCase(deleteSupplier.fulfilled, (state, action: PayloadAction<string>) => {
        state.suppliers = state.suppliers.filter((supplier) => supplier.id !== action.payload);
        state.pagination.totalItems -= 1;
        state.pagination.totalPages = Math.ceil(
          state.pagination.totalItems / state.pagination.itemsPerPage
        );
        if (state.pagination.currentPage > state.pagination.totalPages) {
          state.pagination.currentPage = state.pagination.totalPages;
        }
        state.status = 'fulfilled';
        state.isLoading = false;
      })
      .addCase(deleteSupplier.rejected, (state, action) => {
        state.status = 'rejected';
        state.isLoading = false;
        state.error = action.error.message || 'Error al eliminar el proveedor';
      })
      .addCase(createContact.fulfilled, (state, action) => {
        const supplierId = action.meta.arg.supplierId;
        const supplierIndex = state.suppliers.findIndex((s) => s.id === supplierId);
        if (supplierIndex !== -1) {
          state.suppliers[supplierIndex].contact_count += 1;
        }
      })
      .addCase(deleteContact.fulfilled, (state, action) => {
        const supplierId = action.meta.arg.supplierId;
        const supplierIndex = state.suppliers.findIndex((s) => s.id === supplierId);
        if (supplierIndex !== -1) {
          state.suppliers[supplierIndex].contact_count -= 1;
        }
      });
  }
});

export default supplierSlice.reducer;
