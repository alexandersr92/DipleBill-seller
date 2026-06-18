export interface IInventaryProduct {
  sku: string;
  barcode: string;
  name: string;
  description: string;
  price: string;
  min_stock: string;
  unit_of_measure: string;
  suppliers: string;
}

export interface IInventory {
  id?: string;
  name: string;
  store?: string;
  store_id: string;
  address: string;
  productsQuantity?: number;
}

export interface IEditInventory {
  id?: string;
  name: string;
  store?: string;
  store_id: string;
  address: string;
  description: string;
}

export interface EditInventoryData extends IEditInventory {
  id: string;
}

export interface IAddInventory {
  name: string;
  store_id: string;
  address: string;
  description: string;
}

export interface IInventoryProductDetail {
  id: string;
  quantity: number;
  status: string;
  price: string;
  barcode: string;
  sku: string;
  tags: string[];
  category: string[];
  inventory_id: string;
  inventory_name: string;
  name: string;
  product_id: string;
}

export interface IInventoryProductItem {
  id: string;
  name: string;
  price: number;
  product_id: string;
  quantity: number;
  sku: string;
  status: string;
  barcode: string;
  tags: IProductTag[];
  categories: IProductCategory[];
}

export interface ISingleInventoryTemp {
  id: string;
  products: {
    product_id: string;
    inventory_id: string;
    quantity: number;
  }[];
}

export interface IInventoryPreview {
  id: string;
  name: string;
  store: string;
  store_id: string;
  address: string;
  productsQuantity: number;
}

export type TInventory = Omit<IInventoryPreview, 'productsQuantity'> & {
  details: IInventoryProductDetail[];
};

interface IPivotCategory {
  product_id: string;
  category_id: string;
}

interface IPivotTag {
  product_id: string;
  tag_id: string;
}

interface IProductTag {
  id: string;
  name: string;
  organization_id: string;
  pivot: IPivotTag;
}

interface IProductCategory {
  id: string;
  name: string;
  organization_id: string;
  pivot: IPivotCategory;
}
