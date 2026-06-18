import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { initialState } from './initialState.ts';
import { IPurchaseItem } from '../types/compras.types.ts';
import { editPurchase, getPurchaseById, getPurchases } from './purchaseThunks.ts';

export const purchaseSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    clearPurchase: (state) => {
      state.purchase = null;
    },
    //para cuando la tabla de productos se ponga en compras
    // addPurchaseProduct: (state, action: PayloadAction<IComprasProduct>) => {
    //   state.isLoading = true;
    //   state.error = null;
    //   state.status = 'pending';
    //   const existProduct = state.productsSelected.find(
    //     (product) => product.id === action.payload.id
    //   );
    //   if (existProduct) {
    //     existProduct.quantity += 1;
    //     existProduct.total = existProduct.quantity * (existProduct.price || 0);
    //   } else {
    //     state.productsSelected.push({
    //       ...action.payload,
    //       price: parseFloat(action.payload.price.toString()),
    //       quantity: action.payload.quantity ? 1 : 0,
    //       total: parseFloat(action.payload.total.toString()),
    //       grand_total: parseFloat(action.payload.total.toString()),
    //       discount: parseFloat(action.payload.discount.toString())
    //     });
    //   }
    //   state.isLoading = false;
    //   state.status = 'fulfilled';
    // },
    // deleteSelectedProductById: (state, action: PayloadAction<string>) => {
    //   state.isLoading = true;
    //   state.error = null;
    //   state.status = 'pending';
    //   const existProduct = state.productsSelected.find(
    //     (product) => product.product_id === action.payload
    //   );
    //   if (existProduct) {
    //     const index = state.productsSelected.indexOf(existProduct);
    //     state.productsSelected.splice(index, 1);
    //   }
    //   state.isLoading = false;
    //   state.status = 'fulfilled';
    // },
    // muchos items
    // deleteSelectedProducts(state, action: PayloadAction<string[]>) {
    //   const productIdsToDelete = action.payload;
    //   state.productsSelected = state.productsSelected.filter(
    //     (product) => !productIdsToDelete.includes(product.product_id)
    //   );
    // },
    // updateProductField: (
    //   state,
    //   action: PayloadAction<{ id: string; field: keyof IInvoiceProduct; value: number }>
    // ) => {
    //   const { id, field, value } = action.payload;
    //   state.productsSelected = state.productsSelected.map((product) => {
    //     if (product.id !== id) {
    //       return product;
    //     }
    //     const updatedProduct = { ...product, [field]: value };
    //     const currentQuantity = updatedProduct.quantity || 0;
    //     const currentPrice = updatedProduct.price || 0;
    //     const currentDiscount = updatedProduct.discount || 0;
    //     if (field === 'total') {
    //       updatedProduct.price = parseFloat(currentPrice.toFixed(2));
    //       updatedProduct.total = parseFloat(value.toFixed(2));
    //       updatedProduct.grand_total = parseFloat(
    //         (parseFloat(value.toFixed(2)) - currentDiscount).toFixed(2)
    //       );
    //     } else if (field === 'quantity' || field === 'price') {
    //       updatedProduct.total = parseFloat((currentQuantity * currentPrice).toFixed(2));
    //       updatedProduct.grand_total = parseFloat(
    //         (updatedProduct.total - currentDiscount).toFixed(2)
    //       );
    //     } else if (field === 'discount') {
    //       updatedProduct.grand_total = parseFloat(
    //         (updatedProduct.total - currentDiscount).toFixed(2)
    //       );
    //     }
    //     return updatedProduct;
    //   });
    // },

    deletePurchaseById: (state, action: PayloadAction<string>) => {
      const newState = state.purchases.filter((purchase) => purchase.id !== action.payload);
      state.purchases = newState;
      state.isLoading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPurchases.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.status = 'pending';
      })
      .addCase(getPurchases.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        const activePurchases = action.payload.data.filter(
          (purchase: IPurchaseItem) => purchase.status !== 'cancelled'
        );
        const cancelledPurchases = action.payload.data.filter(
          (purchase: IPurchaseItem) => purchase.status === 'cancelled'
        );

        state.cancelledPurchases = cancelledPurchases;
        state.purchases = activePurchases;
        state.isLoading = false;

        state.pagination = {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 10
        };
      })
      .addCase(getPurchases.rejected, (state) => {
        state.isLoading = false;
        state.error = 'failed';
        state.status = 'rejected';
      })
      .addCase(getPurchaseById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.status = 'pending';
      })
      .addCase(getPurchaseById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.status = 'fulfilled';
        state.purchase = action.payload;
      })
      .addCase(getPurchaseById.rejected, (state) => {
        state.isLoading = false;
        state.error = 'failed';
        state.status = 'rejected';
      })
      .addCase(editPurchase.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.status = 'pending';
      })
      .addCase(editPurchase.fulfilled, (state, action) => {
        state.isLoading = false;
        state.status = 'fulfilled';
        if (action.payload) {
          state.purchase = action.payload;
        }
      })
      .addCase(editPurchase.rejected, (state) => {
        state.isLoading = false;
        state.error = 'failed';
        state.status = 'rejected';
      });
  }
});

export const { deletePurchaseById, clearPurchase } = purchaseSlice.actions;

export default purchaseSlice.reducer;
