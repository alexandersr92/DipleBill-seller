export interface IStore {
  id: string;
  name: string;
  address: string;
}

export interface ICurrentStore {
  id: string;
  name: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  print_logo?: File | string;
  print_header?: string;
  print_footer?: string;
  print_note?: string;
  print_width?: string;
  invoice_number?: number;
  invoice_prefix?: string;
  store_currency?: string;
  ruc?: string;
}

export interface IStoreState {
  stores: IStore[];
  store: ICurrentStore | null;
  isLoading: boolean;
  error: string | null;
}
