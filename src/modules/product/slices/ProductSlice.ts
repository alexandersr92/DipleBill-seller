import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { initialState } from './initialState';
import { createProduct, deleteProduct, getProducts, updateProduct } from './productThunks';
import {
  CreatedProductResponse,
  ProductResponse,
  UpdatedProductResponse
} from '../helpers/interfaces';

export const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.status = 'pending';
      })
      .addCase(getProducts.fulfilled, (state, action: PayloadAction<ProductResponse>) => {
        state.isLoading = false;
        state.status = 'fulfilled';
        state.products = action.payload.data.map((product) => ({
          ...product,
          categories: product.categories.map((category) =>
            typeof category === 'string' ? { id: category, name: category } : category
          )
        }));
        state.pagination = {
          currentPage: action.payload.meta.current_page,
          totalPages: action.payload.meta.last_page,
          totalItems: action.payload.meta.total,
          itemsPerPage: action.payload.meta.per_page
        };
      })
      .addCase(getProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.status = 'rejected';
        state.error = action.error.message || 'Error al cargar los productos';
      })
      .addCase(createProduct.fulfilled, (state, action: PayloadAction<CreatedProductResponse>) => {
        state.products.push({
          ...action.payload,
          categories: action.payload.categories.map((category) =>
            typeof category === 'string' ? { id: category, name: category } : category
          )
        });
      })
      .addCase(updateProduct.pending, (state) => {
        state.isLoading = true;
        state.status = 'pending';
      })
      .addCase(updateProduct.fulfilled, (state, action: PayloadAction<UpdatedProductResponse>) => {
        state.isLoading = false;
        state.status = 'fulfilled';
        const index = state.products.findIndex((product) => product.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = {
            ...action.payload,
            categories: action.payload.categories.map((category) =>
              typeof category === 'string' ? { id: category, name: category } : category
            )
          };
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.status = 'rejected';
        state.error = action.error.message || 'Error al actualizar el producto';
      })
      .addCase(deleteProduct.fulfilled, (state, action: PayloadAction<string>) => {
        state.products = state.products.filter((product) => product.id !== action.payload);
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
      .addCase(deleteProduct.rejected, (state, action) => {
        state.status = 'rejected';
        state.isLoading = false;
        state.error = action.error.message || 'Error al eliminar el producto';
      });
  }
});

export default productSlice.reducer;
