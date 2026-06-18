import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { initialContactState } from './initialState';
import {
  createContact,
  deleteContact,
  getContacts,
  updateContact
} from '../services/contactThunks';
import { CreateContactSupplierResponse } from '../helpers/interfaces';

export const contactSlice = createSlice({
  name: 'contacts',
  initialState: initialContactState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getContacts.pending, (state) => {
        state.isLoading = true;
        state.status = 'pending';
      })
      .addCase(getContacts.fulfilled, (state, action: PayloadAction<ContactForm[]>) => {
        state.isLoading = false;
        state.status = 'fulfilled';
        state.contacts = action.payload;
      })
      .addCase(createContact.pending, (state) => {
        state.isLoading = true;
        state.status = 'pending';
      })
      .addCase(
        createContact.fulfilled,
        (state, action: PayloadAction<CreateContactSupplierResponse>) => {
          state.isLoading = false;
          state.status = 'fulfilled';
          const newContact: ContactForm = {
            id: action.payload.id,
            name: action.payload.name,
            email: action.payload.email,
            phone: action.payload.phone,
            notes: action.payload.notes ?? undefined
          };
          state.contacts.push(newContact);
        }
      )
      .addCase(createContact.rejected, (state, action) => {
        state.isLoading = false;
        state.status = 'rejected';
        state.error = action.error.message || 'Error al crear el contacto';
      })
      .addCase(updateContact.pending, (state) => {
        state.isLoading = true;
        state.status = 'pending';
      })
      .addCase(updateContact.fulfilled, (state, action: PayloadAction<ContactFullData>) => {
        state.isLoading = false;
        state.status = 'fulfilled';
        const index = state.contacts.findIndex((contact) => contact.id === action.payload.id);
        if (index !== -1) {
          state.contacts[index] = action.payload;
        }
      })
      .addCase(updateContact.rejected, (state, action) => {
        state.isLoading = false;
        state.status = 'rejected';
        state.error = action.error.message || 'Error al actualizar el contacto';
      })
      .addCase(deleteContact.fulfilled, (state, action: PayloadAction<string>) => {
        state.contacts = state.contacts.filter((contact) => contact.id !== action.payload);
        state.status = 'fulfilled';
        state.isLoading = false;
      })
      .addCase(deleteContact.rejected, (state, action) => {
        state.status = 'rejected';
        state.isLoading = false;
        state.error = action.error.message || 'Error al eliminar el contacto';
      });
  }
});

export default contactSlice.reducer;
