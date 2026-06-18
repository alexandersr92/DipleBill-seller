import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createBilling, getAllInvoices } from '../services/billingThunks';
import {
  IGetInvoiceResponse,
  IGetSingleInvoiceResponse,
  IInvoice,
  IInvoiceProduct
} from '../types';
import { initialState } from './initialState';

const generateUid = () => `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

export const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    addProductsToBilling: (state, action: PayloadAction<IInvoiceProduct>) => {
      state.isLoading = true;
      state.error = null;
      state.status = 'pending';

      const existProduct = state.productsSelected.find(
        (product) => product.id === action.payload.id
      );

      if (existProduct) {
        existProduct.quantity += 1;
        existProduct.total = existProduct.quantity * (existProduct.price || 0);
      } else {
        state.productsSelected.push({
          ...action.payload,
          price: parseFloat(action.payload.price.toString()),
          quantity: action.payload.quantity ? 1 : 0,
          total: parseFloat(action.payload.total.toString()),
          grand_total: parseFloat(action.payload.total.toString()),
          discount: parseFloat(action.payload.discount.toString()),
          temp_id: generateUid()
        });
      }

      state.isLoading = false;
      state.status = 'fulfilled';
    },

    deleteSelectedProduct: (state, action: PayloadAction<string>) => {
      state.isLoading = true;
      state.error = null;
      state.status = 'pending';

      const existProduct = state.productsSelected.find(
        (product) => product.temp_id === action.payload
      );

      if (existProduct) {
        const index = state.productsSelected.indexOf(existProduct);
        state.productsSelected.splice(index, 1);
      }

      state.isLoading = false;
      state.status = 'fulfilled';
    },

    deleteSelectedProducts(state, action: PayloadAction<string[]>) {
      const productIdsToDelete = action.payload;
      state.productsSelected = state.productsSelected.filter(
        (product) => !productIdsToDelete.includes(product.temp_id ?? '')
      );
    },

    resetProductsInvoice: (state) => {
      state.productsSelected = [];
    },

    updateProductField: (
      state,
      action: PayloadAction<{ id: string; field: keyof IInvoiceProduct; value: number }>
    ) => {
      const { id, field, value } = action.payload;

      state.productsSelected = state.productsSelected.map((product) => {
        if (product.temp_id !== id) return product;

        const updatedProduct = { ...product, [field]: value };

        const currentQuantity = updatedProduct.quantity || 0;
        const currentPrice = updatedProduct.price || 0;
        const currentDiscount = updatedProduct.discount || 0;

        if (field === 'total') {
          const total = +value.toFixed(2);
          updatedProduct.total = total;
          updatedProduct.grand_total = +(total - currentDiscount).toFixed(2);
        } else if (field === 'quantity' || field === 'price') {
          const total = +(currentQuantity * currentPrice).toFixed(2);
          updatedProduct.total = total;
          updatedProduct.grand_total = +(total - currentDiscount).toFixed(2);
        } else if (field === 'discount') {
          const total = updatedProduct.total || 0;
          updatedProduct.grand_total = +(total - currentDiscount).toFixed(2);
        }

        return updatedProduct;
      });
    },

    updateInvoice: (state, action: PayloadAction<Partial<IInvoice>>) => {
      Object.assign(state.invoice, action.payload);
    },

    clearInvoice: (state) => {
      state.invoice = initialState.invoice;
    },

    cancelInvoiceById: (state, action: PayloadAction<string>) => {
      state.isLoading = true;
      state.error = null;
      state.status = 'pending';

      const invoiceId = action.payload;
      const invoice = state.invoices.find((invoice) => invoice.id === invoiceId);

      if (invoice) {
        invoice.invoice_status = 'canceled';
      }

      state.isLoading = false;
      state.status = 'fulfilled';
    },

    duplicateProduct: (state, action: PayloadAction<string>) => {
      state.isLoading = true;
      state.error = null;
      state.status = 'pending';

      const productId = action.payload;
      const productToDuplicate = state.productsSelected.find(
        (product) => product.temp_id === productId
      );

      if (productToDuplicate?.quantity && productToDuplicate?.quantity <= 1) {
        state.isLoading = false;
        state.status = 'fulfilled';
        return;
      }

      if (productToDuplicate) {
        const duplicatedProduct: IInvoiceProduct = {
          ...productToDuplicate,
          temp_id: generateUid(),
          quantity: 1,
          total: productToDuplicate.price || 0,
          grand_total: productToDuplicate.price || 0,
          discount: 0
        };
        state.productsSelected.push(duplicatedProduct);
      }

      state.isLoading = false;
      state.status = 'fulfilled';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBilling.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.status = 'pending';
      })
      .addCase(
        createBilling.fulfilled,
        (state, action: PayloadAction<IGetSingleInvoiceResponse>) => {
          state.status = 'fulfilled';
          state.isLoading = false;

          const newInvoice = {
            ...action.payload.data
          };

          state.invoices.push(newInvoice);
        }
      )
      .addCase(createBilling.rejected, (state) => {
        state.isLoading = false;
        state.error = 'failed';
        state.status = 'rejected';
      })

      .addCase(getAllInvoices.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.status = 'pending';
      })
      .addCase(getAllInvoices.fulfilled, (state, action: PayloadAction<IGetInvoiceResponse>) => {
        state.isLoading = false;
        state.status = 'fulfilled';

        state.invoices = action.payload.data;

        state.pagination = {
          currentPage: action.payload.meta.current_page,
          totalPages: action.payload.meta.last_page,
          totalItems: action.payload.meta.total,
          itemsPerPage: action.payload.meta.per_page
        };
      })
      .addCase(getAllInvoices.rejected, (state) => {
        state.isLoading = false;
        state.error = 'failed';
        state.status = 'rejected';
      });
  }
});

export const {
  addProductsToBilling,
  deleteSelectedProduct,
  deleteSelectedProducts,
  resetProductsInvoice,
  updateProductField,
  updateInvoice,
  clearInvoice,
  cancelInvoiceById,
  duplicateProduct
} = billingSlice.actions;

export default billingSlice.reducer;
