export interface IComprasProduct {
  product_id: number;
  sku: string;
  product_name: string;
  barcode: string;
  price: number;
  quantity: number;
  cost: number;
}

export interface IInvalidProduct {
  row: number;
  errors: string[];
  data: {
    sku: string;
    name: string;
    barcode: string;
    price: string;
    quantity: string;
    cost: string;
  };
}
export interface IComprasProductResponse {
  valid_existing: IComprasProduct[];
  valid_new: IComprasProduct[];
  invalid: IInvalidProduct[];
}

export interface IComprasInitialState {
  products: IComprasProduct[];
  productsSelected: IComprasProduct[];
  isLoading: boolean;
  error: string | null;
  status: string;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  purchases: IPurchaseItem[];
  cancelledPurchases: IPurchaseItem[];
  purchase: IPurchaseItem | null;
}

export interface ICompraPayload {
  compra_note: string | null | undefined;
  providerid: string | null | undefined;
  inventoryId: string | null | undefined;
  compra_date: string | null | undefined;
  products: IComprasProduct[];
  store_id: string | null | undefined;
  total: string | null | undefined;
}

export interface IPurchaseItem {
  id: string;
  user_id: string;
  organization_id: string;
  store_id: string;
  store_name: string;
  supplier_id: string;
  supplier_name: string;
  inventory_id: string;
  inventory_name: string;
  total: number;
  purchase_date: string;
  purchase_note: string | null;
  status: string;
  total_items: number;
  products: IComprasProduct[];
}

export interface IGetPurchasesResponse {
  data: IPurchaseItem[];
  meta: {
    last_page: number;
    per_page: number;
    total: number;
    current_page: number;
  };
}
