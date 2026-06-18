export interface ProductResponse {
  data: Product[];
  links: Links;
  meta: Meta;
}

export interface Product {
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

export interface getProductsParams {
  per_page: number;
  sort?: string;
  search: string;
  search_by: string;
  order: 'asc' | 'desc';
  tags?: string;
  categories?: string;
  page?: number;
}

export interface ProductByIdResponse {
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
  categories: string[];
  suppliers: string[];
  created_at: string;
  updated_at: string;
}

export interface CreatedProductResponse {
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
  created_at: string;
  updated_at: string;
}

export interface CreateProductRequest {
  inventories?: string;
  sku: string;
  barcode: string;
  name: string;
  description: string;
  image: File | undefined;
  price: string;
  min_stock: number;
  unit_of_measure: string;
  tags: string;
  categories: string;
  suppliers: string;
  cost: string;
}

export interface UpdateProductRequest {
  sku: string;
  barcode: string;
  name: string;
  description: string;
  price: string;
  min_stock: string;
  unit_of_measure: string;
  suppliers: string;
}

export interface UpdatedProductResponse {
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
  categories: string[];
  suppliers: string[];
  created_at: string;
  updated_at: string;
}

export interface DeletedProductResponse {
  id: string;
}

export interface ProductSupplier {
  id: string;
  organization_id: string;
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
  pivot: {
    product_id: string;
    supplier_id: string;
  };
}

export interface PartialUpdateProductRequest {
  sku?: string;
  barcode?: string;
  name?: string;
  description?: string;
  image?: File | string;
  price?: string;
  min_stock?: number;
  unit_of_measure?: string;
  tags?: string;
  categories?: string;
  suppliers?: string;
  inventory?: string;
}
