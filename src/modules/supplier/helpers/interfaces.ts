//get suppliers

export interface SupplierResponse {
  data: Supplier[];
  links: Links;
  meta: Meta;
}

interface Supplier {
  id: string;
  name: string;
  contact_count: number;
  city: string;
  state: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface Links {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

interface Meta {
  current_page: number;
  from: number;
  last_page: number;
  links: MetaLink[];
  path: string;
  per_page: number;
  to: number;
  total: number;
}

interface MetaLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface getSuppliersParams {
  per_page: number;
  sort: string;
  search: string;
  search_by: string;
  order: 'asc' | 'desc';
  page: number;
  store_id?: string;
}

//get supplier by id

export interface SupplierByIdResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  notes: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  contacts: SupplierContact[];
}

interface SupplierContact {
  id: string;
  supplier_id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

//create supplier

export interface CreateContactSupplierResponse {
  id: string;
  supplier_id: string;
  name: string;
  email: string;
  phone: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatedSupplierResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip: string | null;
  notes: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  contacts: CreateContactSupplierResponse[];
}

export interface CreateSupplierContactRequest {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

export interface CreateSupplierRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  notes: string;
  contacts: CreateSupplierContactRequest[];
}

//update supplier

export interface UpdateSupplierRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
}

//update supplier

export interface UpdatedSupplierResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zip: string | null;
  notes: string | null;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  contacts: SupplierContact[];
}

interface SupplierContact {
  id: string;
  supplier_id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

//delete supplier

export interface DeletedSupplierResponse {
  id: string;
}

//get contacts

export interface Contact {
  id: string;
  supplier_id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type GetContactsResponse = Contact[];

//create contact

export interface CreateContactSupplierResponse {
  id: string;
  supplier_id: string;
  name: string;
  email: string;
  phone: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

//update contact

export interface UpdatedContactResponse {
  id: string;
  supplier_id: string;
  name: string;
  email: string;
  phone: string;
  notes: string;
  created_at: string;
  updated_at: string;
}
