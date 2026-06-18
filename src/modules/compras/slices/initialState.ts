import { IComprasInitialState } from '../types/compras.types';

export const initialState: IComprasInitialState = {
  products: [],
  productsSelected: [],
  isLoading: false,
  error: null,
  status: 'idle',
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  },
  purchases: [],
  purchase: null,
  cancelledPurchases: []
};
