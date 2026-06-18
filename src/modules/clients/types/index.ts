export interface IClient {
  id?: string;
  name: string;
  phone: string;
  city: string;
  state: string;
  has_credit: boolean;
  wholesaler: boolean;
  created_at?: string;
  updated_at?: string;
  stores: string[];
}

export type TClients = IClient[];

export interface ISingleClient {
  id?: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  address: string;
  country: string;
  has_credit: boolean;
  notes: string;
  organization_id?: string;
  wholesaler: boolean;
  created_at?: string;
  updated_at?: string;
  stores?: string[];
}

export interface IUpdatedClient {
  id?: string;
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
}

export interface IAddClient {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  wholesaler: boolean;
  organization_id: string;
  notes: string;
  stores: string[];
}
