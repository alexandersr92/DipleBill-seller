import { ISingleClient } from '../types';
import { IClientState } from './client.types';

export const initialState: IClientState = {
  clients: [],
  isLoading: false,
  error: null,
  status: 'idle',
  pagination: {
    currentPage: 1,
    totalPages: 1,
    perPage: 10,
    totalItems: 10
  }
};

const tempData: ISingleClient[] = [
  {
    id: '002eafca-f177-4778-841a-1623386ed84a',
    name: 'Pagac, Bechtelar and Cummings',
    email: 'boyd84@example.com',
    phone: '(763) 226-7416',
    address: '92515 Bogisich Cliff\nKrismouth, NE 92564-7803',
    city: 'Weimannborough',
    state: 'Mississippi',
    country: 'Saint Kitts and Nevis',
    wholesaler: true,
    has_credit: true,
    notes: 'Quos excepturi vel est.',
    created_at: '2024-08-28T06:14:17.000000Z',
    updated_at: '2024-08-28T06:14:17.000000Z',
    stores: ['002eafca-f177-4778-841a-1623386ed84a']
  },
  {
    id: 'a15db1de-f84e-4d59-bcf9-6a8473e36b3b',
    name: 'Schuster LLC',
    email: 'alaina.gaylord@example.com',
    phone: '(927) 762-5476',
    address: '16422 Fisher Green\nSouth Verla, IA 52723-2234',
    city: 'Lake Icie',
    state: 'Florida',
    country: 'Honduras',
    wholesaler: false,
    has_credit: false,
    notes: 'Iure quisquam quos atque.',
    created_at: '2024-08-29T08:23:45.000000Z',
    updated_at: '2024-08-29T08:23:45.000000Z',
    stores: ['a15db1de-f84e-4d59-bcf9-6a8473e36b3b']
  },
  {
    id: '9b7f1c9b-e8f7-4e8b-bde7-7465f4a6ef7a',
    name: 'Kulas Group',
    email: 'ruby.corkery@example.com',
    phone: '(812) 543-1127',
    address: '19998 Cathrine Street\nEast Adelle, AL 57621-7750',
    city: 'Port Dean',
    state: 'California',
    country: 'Nigeria',
    wholesaler: true,
    has_credit: true,
    notes: 'Provident expedita dolorem quo.',
    created_at: '2024-08-30T12:54:32.000000Z',
    updated_at: '2024-08-30T12:54:32.000000Z',
    stores: ['9b7f1c9b-e8f7-4e8b-bde7-7465f4a6ef7a']
  },
  {
    id: '62f0a3a9-6b68-4f84-b6db-9e0f57f82998',
    name: 'Hegmann, Jast and Friesen',
    email: 'bonnie.schmidt@example.com',
    phone: '(215) 975-5621',
    address: '980 West Hills\nWest Emmy, SD 57632-6923',
    city: 'North Annabell',
    state: 'New York',
    country: 'Indonesia',
    wholesaler: false,
    has_credit: false,
    notes: 'Laborum sed deserunt quod.',
    created_at: '2024-08-31T07:43:21.000000Z',
    updated_at: '2024-08-31T07:43:21.000000Z',
    stores: ['62f0a3a9-6b68-4f84-b6db-9e0f57f82998']
  },
  {
    id: 'c67b3b7a-09da-4a3e-9c3c-dc38491f3b42',
    name: 'Fadel and Sons',
    email: 'leonard78@example.com',
    phone: '(543) 215-9476',
    address: '5544 Cremin Stravenue\nNew Oren, WY 82642-2460',
    city: 'Lake Alexandrea',
    state: 'Texas',
    country: 'Australia',
    wholesaler: true,
    has_credit: true,
    notes: 'Voluptatum amet recusandae soluta.',
    created_at: '2024-09-01T09:12:05.000000Z',
    updated_at: '2024-09-01T09:12:05.000000Z',
    stores: ['c67b3b7a-09da-4a3e-9c3c-dc38491f3b42']
  }
];

export const dummyState: IClientState = {
  clients: tempData,
  isLoading: false,
  error: null,
  status: 'idle',
  pagination: {
    currentPage: 1,
    totalPages: 1,
    perPage: 10,
    totalItems: 10
  }
};
