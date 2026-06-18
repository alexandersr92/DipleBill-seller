import { IInventaryProduct, IInventory, IInventoryProductItem } from '../types';

export const tempData: IInventaryProduct = {
  sku: 'SKU001',
  barcode: '20202020202',
  name: 'Test Product 2222222',
  description: 'This is a product test',
  price: '99.99',
  min_stock: '10',
  unit_of_measure: 'u',
  suppliers: 'd2d54247-7fce-4a69-aa05-ac1b037f0597'
};

export interface ISingleInventory {
  inventory: {
    id: string;
    name: string;
    store: string;
    store_id: string;
    address: string;
    description: string;
  };
  details: IInventoryProductItem[];
  pagination: {
    current_page: number;
    last_page: number;
    next_page_url: string;
    prev_page_url: string;
    total: number;
    per_page: number;
  };
}

export type TGetInventoriesResponse = IInventory[];

export interface IInventoryState {
  inventories: IInventory[];
  inventory: ISingleInventory | null;
  isLoading: boolean;
  error: string | null;
  status: 'idle' | 'pending' | 'fulfilled' | 'rejected';
}

export const initialState: IInventoryState = {
  inventories: [],
  inventory: null,
  isLoading: false,
  error: null,
  status: 'idle'
};
