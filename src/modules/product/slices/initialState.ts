export interface IProduct {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  description: string;
  image: string;
  price: number;
  min_stock: number;
  unit_of_measure: string;
  tags: string[];
  categories: { id: string; name: string }[];
  suppliers: string[];
}

interface SupplierState {
  products: IProduct[];
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

export const initialState: SupplierState = {
  products: [],
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
