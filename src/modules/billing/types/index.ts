export const SELL_TYPES = {
  CREDITO: 'credito',
  CONTADO: 'contado'
};

export const PAYMENT_METHODS = {
  EFECTIVO: 'CASH',
  TRANSFERENCIA: 'BACS'
};

export interface IGetBillingProducts {
  page: number;
  perPage: number;
  storeId?: string;
}

export interface ICategory {
  id: string;
  name: string;
}

export interface ITag {
  id: string;
  name: string;
}

// export interface IProductBase {
//   id: string;
//   sku: string;
//   barcode: string;
//   name: string;
//   image: string;
//   cost: number;
//   price: number;
//   stock: number;
//   min_stock: number;
//   unit_of_measure: string;
//   categories: ICategory[];
//   tags: ITag[];
//   inventory: IInventoryInProduct[];
// }

export interface IProducts {
  id: string;
  product_id: string;
  sku: string;
  barcode: string;
  name: string;
  product?: string;
  image: string;
  cost: number;
  price: number;
  quantity: number;
  min_stock: number;
  unit_of_measure: string;
  categories: ICategory[];
  tags: ITag[];
  inventory: IInventoryInProduct[];
}

export interface IInventoryInProduct {
  id: string;
  quantity: number;
  inventory_id: string;
  inventory_name: string;
}

export interface IInvoiceProduct extends IProducts {
  inventory_name?: string;
  inventory_id?: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
  tax: number;
  grand_total: number;
  temp_id?: string;
}

export interface IGetBillingProductsResponse {
  data: IProducts[];
  meta: {
    per_page: number;
    total: number;
    current_page: number;
  };
}

export interface IBillingProductsProductsState {
  products: IProducts[];
  productsSelected: IInvoiceProduct[];
  invoice: IInvoice;
  invoices: ISingleInvoice[];
  lastNumberInvoice: string | number;
  isLoading: boolean;
  error: null | string;
  status: 'idle' | 'pending' | 'fulfilled' | 'rejected';
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  isEditing: boolean;
  editingInvoiceId: string | null;
  editingInvoiceNumber: string | null;
}

// export interface INewBilling {
//   inventoryId: string;
//   storeId: string;
//   invoiceNumber: string;
//   invoiceDate: string;
//   clientName: string;
//   idSeller: string;
//   idClient?: string;
//   credit?: boolean;
//   creditAmount?: number;
//   expDate: string;
//   paymentMethod: 'BACS' | 'CASH' | 'BANK' | string;
//   paymentDate: string;
//   invoiceDescription: string;
//   invoiceProducts: {
//     id: string;
//     inventoryId: string;
//     price: number;
//     stock: number;
//     discount: number;
//     tax: number;
//     grandTotal: number;
//   }[];
// }

// export interface IAddNewInvoice {
//   inventory_id?: string;
//   store_id: string;
//   invoice_number: string;
//   invoice_date: string;
//   client_name: string;
//   seller_id: string;
//   client_id?: string;
//   idCredit?: boolean;
//   creditAmount?: number;
//   expDate: string;
//   payment_method: 'BACS' | 'CASH' | 'BANK' | string;
//   payment_date: string;
//   invoice_note: string;
//   products: InvoiceProduct[];
//   init_payment: number;
//   total: number;
//   discount: number;
//   tax: number;
//   grand_total: number;
// }

export interface IInvoice {
  client_id: string | null;
  store_id: string;
  invoice_number: string;
  invoice_date: string;
  invoice_note: string;
  client_name: string;
  total: number;
  discount: number;
  tax: number;
  grand_total: number;
  payment_method: string;
  payment_date: string;
  products: IInvoiceProducts[];
  isCredit: boolean;
  init_payment: number;
  seller_id: string;
  payment_metadata?: any;
}

export interface IInvoices extends IInvoice {
  id: string;
  invoice_status?: string;
  total_items?: number;
  client?: IInvoiceClient;
}

interface IInvoiceProducts {
  product_id: string;
  inventory_id: string;
  quantity: number;
  price: number;
  total: number;
  discount: number;
  tax: number;
  grand_total: number;
}

export interface IInvoiceBase {
  id?: string;
  client_name: string;
  invoice_number: string;
  invoice_date: string;
  invoice_status: string;
  total_items: number;
  client: IInvoiceClient;
  grand_total: number;
}

export interface IInvoiceClient {
  id?: string;
  organization_id: string;
  name: string;
  cedula_ruc?: string | null;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip: null | string;
  status: string;
  wholesaler: number;
  notes: string;
}

export interface ISingleInvoice extends IInvoiceBase {
  client_id: string | null;
  discount: number;
  tax: number;
  method: null | string;
  invoice_type?: string;
  invoice_note?: string;
  payment_metadata?: any;
  seller_id?: string | null;
  seller?: string | null;
  client_cedula_ruc?: string | null;
  invoice_details: {
    id: string;
    product_id: string;
    product_name: string;
    inventory_id: string;
    quantity: number;
    price: number;
    total: number;
    sku: string;
    barcode?: string | null;
    discount?: number;
    tax?: number;
    grand_total?: number;
    sort_order?: number;
  }[];
}

export interface IGetSingleInvoiceResponse {
  data: ISingleInvoice;
}

export interface IReplaceInvoiceResponse {
  message: string;
  invoice: {
    data: ISingleInvoice;
  };
}

export interface IGetInvoiceResponse {
  data: ISingleInvoice[];
  meta: {
    last_page: number;
    per_page: number;
    total: number;
    current_page: number;
  };
}
