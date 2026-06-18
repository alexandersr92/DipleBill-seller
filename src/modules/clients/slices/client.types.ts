import { ISingleClient } from '../types';

export interface IClientState {
  clients: ISingleClient[];
  isLoading: boolean;
  error: null | string;
  status: 'idle' | 'pending' | 'fulfilled' | 'rejected';
  pagination: {
    currentPage: number;
    totalPages: number;
    perPage: number;
    totalItems: number;
  };
}

export interface getClientsParams {
  per_page?: number;
  sort?: string;
  search?: string;
  search_by?: string;
  order?: 'asc' | 'desc';
  page?: number;
  store_id?: string;
}

export interface IGetClientsResponse {
  data: ISingleClient[];
  meta: {
    per_page: number;
    total: number;
    current_page: number;
    last_page: number;
  };
}

export interface INewClientResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  wholesaler: boolean;
  has_credit: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
  stores?: string[];
}

export interface IUpdatedClientResponse {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  wholesaler: boolean;
  has_credit: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface IGetClientByIdResponse extends INewClientResponse {
  stores: [];
}

export type TGetClientByIdParams = Pick<IGetClientByIdResponse, 'id'>;

export type TClientWithoutStores = Omit<IGetClientByIdResponse, 'stores'>;
