import { ICreditInitialState } from '../types';

export const initialState: ICreditInitialState = {
  credits: [],
  currentCredit: null,
  invoice: null,
  isLoading: false,
  error: null,
  status: 'idle',
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  }
};