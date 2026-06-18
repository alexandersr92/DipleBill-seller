export interface StoreForm {
  name: string;
  email: string;
  description: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip?: string;
  print_logo?: File | string | null;
  print_header?: string | null;
  print_footer?: string | null;
  print_note?: string | null;
  print_width?: string | null;
  invoice_number?: number | null;
  invoice_prefix?: string | null;
  store_currency?: string | null;
}
