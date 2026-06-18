interface SupplierState {
  suppliers: SupplierData[];
  isLoading: boolean;
  error: string | null;
  status: 'idle' | 'pending' | 'fulfilled' | 'rejected';
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

interface ContactState {
  contacts: ContactForm[];
  isLoading: boolean;
  error: string | null;
  status: 'idle' | 'pending' | 'fulfilled' | 'rejected';
}

export const initialState: SupplierState = {
  suppliers: [],
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

export const initialContactState: ContactState = {
  contacts: [],
  isLoading: false,
  error: null,
  status: 'idle'
};
