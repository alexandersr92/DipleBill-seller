import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ICurrentStore, IStore } from './store.types';
import initialState from './initiaState';
import { deleteStoreThunk, fetchCurrentStore, fetchStores } from './storeThunks';

export const storeSlice = createSlice({
  name: 'store',
  initialState,
  reducers: {
    setCurrentStore: {
      reducer(state) {
        state.isLoading = true;
        state.error = null;
      },
      prepare(storeId: string) {
        return { payload: storeId };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStores.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchStores.fulfilled, (state, action: PayloadAction<IStore[]>) => {
        state.stores = action.payload;
        state.isLoading = false;
        state.error = null;
      })

      .addCase(fetchStores.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchCurrentStore.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentStore.fulfilled, (state, action: PayloadAction<ICurrentStore>) => {
        state.store = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchCurrentStore.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteStoreThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteStoreThunk.fulfilled, (state) => {
        state.stores = state.stores.filter((store) => store.id !== state.store?.id);
        if (state.stores.length === 1) {
          fetchCurrentStore(state.stores[0].id);
        }
        state.isLoading = false;
      })
      .addCase(deleteStoreThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { setCurrentStore } = storeSlice.actions;
export default storeSlice.reducer;
