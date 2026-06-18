import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { initialState, ISingleInventory, TGetInventoriesResponse } from './initialState';
import {
  editInventory,
  getInventories,
  addInventory as addInventoryThunk,
  deleteInventory as deleteInventoryThunk,
  getInventoryProducts
} from '../services/inventoryThunks';
import { EditInventoryData, IAddInventory, IInventory, ISingleInventoryTemp } from '../types';

export const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    addInventory: (state, action: PayloadAction<ISingleInventoryTemp>) => {
      state.isLoading = true;
      state.error = null;
      state.status = 'pending';

      if (!state.inventories) {
        state.error = 'Inventory does not exist';
      }

      const { id } = action.payload;

      const inventory = state.inventories?.find((inv) => inv.id === id);

      if (!inventory) {
        state.error = 'Inventory does not exist';
        state.isLoading = false;
        state.status = 'rejected';
        return;
      }

      state.isLoading = false;
      state.status = 'fulfilled';
    },
    deleteInventory: (state, action: PayloadAction<IInventory>) => {
      const id = action.payload.id;

      state.isLoading = true;
      state.error = null;
      state.status = 'pending';

      state.inventories = state.inventories.filter((inventory) => inventory.id !== id);

      state.isLoading = false;
      state.status = 'fulfilled';
    },
    addInventorySelected: (state, action: PayloadAction<ISingleInventory>) => {
      state.inventory = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getInventories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.status = 'pending';
      })
      .addCase(
        getInventories.fulfilled,
        (state, action: PayloadAction<TGetInventoriesResponse>) => {
          state.isLoading = false;
          state.status = 'fulfilled';

          state.inventories = action.payload;
        }
      )
      .addCase(editInventory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.status = 'pending';
      })
      .addCase(editInventory.fulfilled, (state, action: PayloadAction<EditInventoryData>) => {
        state.isLoading = false;

        const index = state.inventories.findIndex(
          (inventory) => inventory.id === action.payload.id
        );

        if (index !== -1) {
          state.inventories[index] = { ...state.inventories[index], ...action.payload };
        }
        state.status = 'fulfilled';
      })
      .addCase(editInventory.rejected, (state) => {
        state.isLoading = false;
        state.error = 'failed';
        state.status = 'rejected';
      })
      .addCase(addInventoryThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.status = 'pending';
      })
      .addCase(addInventoryThunk.fulfilled, (state, action: PayloadAction<IAddInventory>) => {
        state.status = 'fulfilled';
        state.isLoading = false;
        state.inventories.push(action.payload);
      })
      .addCase(addInventoryThunk.rejected, (state) => {
        state.isLoading = false;
        state.error = 'failed';
        state.status = 'rejected';
      })
      .addCase(deleteInventoryThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.status = 'pending';
      })
      .addCase(deleteInventoryThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.status = 'fulfilled';

        const id = action.meta.arg;
        state.inventories = state.inventories.filter((inventory) => inventory.id !== id);
      })
      .addCase(deleteInventoryThunk.rejected, (state) => {
        state.isLoading = false;
        state.error = 'failed';
        state.status = 'rejected';
      })
      .addCase(getInventoryProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.status = 'pending';
      })
      .addCase(getInventoryProducts.fulfilled, (state, action: PayloadAction<ISingleInventory>) => {
        state.isLoading = false;
        state.status = 'fulfilled';
        state.inventory = { ...action.payload };
      })
      .addCase(getInventoryProducts.rejected, (state) => {
        state.isLoading = false;
        state.error = 'failed';
        state.status = 'rejected';
      });
  }
});

export const { addInventory, deleteInventory, addInventorySelected } = inventorySlice.actions;
export default inventorySlice.reducer;
