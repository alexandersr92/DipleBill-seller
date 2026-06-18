import { ReactNode } from 'react';

export type ChildrenContainerProps = {
  children: ReactNode;
};

export type AppDialogProps = {
  children?: ReactNode;
  trigger?: ReactNode;
  title: string;
  description?: string;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export interface IMetaRequestParams {
  per_page: number;
  sort?: string;
  search: string;
  search_by: string;
  order: 'asc' | 'desc';
  page?: number;
  date_from?: string;
  date_to?: string;
  method?: string;
  number_invoice_from?: string;
  number_invoice_to?: string;
  invoice_status?: string;
  sort_by?: string;
  store_id?: string;
}

export interface IInventoryMetaRequestParams {
  store: string;
}
