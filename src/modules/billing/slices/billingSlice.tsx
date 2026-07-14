import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createBilling, getAllInvoices, replaceInvoice } from '../services/billingThunks';
import {
  IGetInvoiceResponse,
  IGetSingleInvoiceResponse,
  IInvoice,
  IInvoiceProduct,
  ISingleInvoice,
  IReplaceInvoiceResponse
} from '@diplebill/core';
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
        const rawPrice = action.payload.price ?? 0;
        const rawTotal = action.payload.total ?? 0;
        const rawDiscount = action.payload.discount ?? 0;

        const cleanPrice = isNaN(parseFloat(rawPrice.toString())) ? 0 : parseFloat(rawPrice.toString());
        const cleanTotal = isNaN(parseFloat(rawTotal.toString())) ? 0 : parseFloat(rawTotal.toString());
        const cleanDiscount = isNaN(parseFloat(rawDiscount.toString())) ? 0 : parseFloat(rawDiscount.toString());

        state.productsSelected.push({
          ...action.payload,
          price: cleanPrice,
          quantity: action.payload.quantity ? 1 : 0,
          total: cleanTotal,
          grand_total: cleanTotal,
          discount: cleanDiscount,
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
    },

    startEditingInvoice: (state, action: PayloadAction<ISingleInvoice>) => {
      const invoice = action.payload;
      state.isEditing = true;
      state.editingInvoiceId = invoice.id || null;
      state.editingInvoiceNumber = invoice.invoice_number;

      // Ordenar por sort_order para mantener el orden original
      const details = [...invoice.invoice_details].sort(
        (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      );

      // Cargar productos seleccionados
      state.productsSelected = details.map((detail) => {
        const price = parseFloat(detail.price?.toString() || '0');
        const quantity = parseFloat(detail.quantity?.toString() || '0');
        const total = parseFloat(detail.total?.toString() || '0');
        const discount = parseFloat(detail.discount?.toString() || '0');
        const grand_total = parseFloat(
          detail.grand_total?.toString() || detail.total?.toString() || '0'
        );

        return {
          id: detail.product_id,
          product_id: detail.product_id,
          sku: detail.sku,
          barcode: detail.barcode || '',
          name: detail.product_name,
          image: '',
          cost: 0,
          price: price,
          quantity: quantity,
          min_stock: 0,
          unit_of_measure: '',
          categories: [],
          tags: [],
          inventory: [],
          discount: discount,
          total: total,
          grand_total: grand_total,
          temp_id: detail.id || generateUid(),
          inventory_id: detail.inventory_id
        } as unknown as IInvoiceProduct;
      });

      // Cargar campos del formulario de la factura
      state.invoice = {
        client_id: invoice.client_id,
        store_id: '',
        invoice_number: invoice.invoice_number,
        invoice_date: invoice.invoice_date,
        invoice_note: invoice.invoice_note || '',
        client_name: invoice.client_name,
        total: invoice.total_items,
        discount: invoice.discount,
        tax: invoice.tax,
        grand_total: invoice.grand_total,
        payment_method: invoice.method || 'CASH',
        payment_date: invoice.invoice_date,
        products: [],
        isCredit: invoice.invoice_type === 'credit',
        init_payment: 0,
        seller_id: invoice.seller_id || ''
      };
    },

    cancelEditingInvoice: (state) => {
      state.isEditing = false;
      state.editingInvoiceId = null;
      state.editingInvoiceNumber = null;
      state.productsSelected = [];
      state.invoice = initialState.invoice;
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
      })

      .addCase(replaceInvoice.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.status = 'pending';
      })
      .addCase(
        replaceInvoice.fulfilled,
        (state, action: PayloadAction<IReplaceInvoiceResponse>) => {
          state.status = 'fulfilled';
          state.isLoading = false;

          const oldInvoice = state.invoices.find((inv) => inv.id === state.editingInvoiceId);
          if (oldInvoice) {
            oldInvoice.invoice_status = 'canceled';
          }

          const newInvoice = {
            ...action.payload.invoice
          };
          state.invoices.push(newInvoice);

          state.isEditing = false;
          state.editingInvoiceId = null;
          state.editingInvoiceNumber = null;
        }
      )
      .addCase(replaceInvoice.rejected, (state) => {
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
  duplicateProduct,
  startEditingInvoice,
  cancelEditingInvoice
} = billingSlice.actions;

export default billingSlice.reducer;
