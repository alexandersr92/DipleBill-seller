import { IBillingProductsProductsState } from '@diplebill/core';

export const initialState: IBillingProductsProductsState = {
  products: [],
  productsSelected: [],
  invoice: {
    client_id: null,
    store_id: '',
    invoice_number: '',
    invoice_date: '',
    invoice_note: '',
    client_name: 'EVENTUAL',
    total: 0,
    discount: 0,
    tax: 0,
    grand_total: 0,
    payment_method: '',
    payment_date: '',
    products: [],
    isCredit: false,
    init_payment: 0,
    seller_id: ''
  },
  invoices: [],
  lastNumberInvoice: 0,
  isLoading: false,
  error: null,
  status: 'idle',
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  },
  isEditing: false,
  editingInvoiceId: null,
  editingInvoiceNumber: null
};

// export const recalculateInvoiceTotals = (state: IBillingProductsProductsState) => {
//   // Calcular el total sumando los grand_total de cada producto seleccionado
//   const total = state.productsSelected.reduce(
//     (acc, product) => acc + (product.grand_total || 0),
//     0
//   );

//   // Calcular el grand_total global del invoice
//   state.invoice.total = parseFloat(total.toFixed(2));
//   state.invoice.grand_total = parseFloat(
//     (total - (state.invoice.init_payment || 0) - (state.invoice.discount || 0)).toFixed(2)
//   );
// };
