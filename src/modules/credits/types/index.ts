import { IInvoice } from '@/modules/billing/types';

export interface ICreditBase {
  id: string;
  amount: number;
  client_id: string;
  client_name: string;
  invoices_qty: number;
  total_credit: number;
  created_at: string;

  total_debt: number;
  total_paid: number;
  total_unpaid: number;
}

interface IPaymentHistory {
  id: string;
  amount: number;
  date: string;
  note: null | string;
  created_at: string;
}

export interface ICredit extends ICreditBase {
  current_debt: number;
  status: string;
  invoice: IInvoice & { id?: string };
  paymentsHistory: IPaymentHistory[];
}

export interface IGetCreditsResponse {
  data: ICreditBase[];
  meta: {
    last_page: number;
    per_page: number;
    total: number;
    current_page: number;
  };
}

export interface IGetCreditResponse {
  data: ICredit;
}

export interface IGetCreditByClientResponse {
  data: CreditInvoice[];
}

export interface CreditInvoice {
  id: string;
  amount: number;
  current_debt: number;
  client: string;
  status: string;
  invoice_number: string;
  invoice_id?: string;
  created_at: string;
}

export interface ICreditInitialState {
  credits: ICreditBase[];
  currentCredit: CreditInvoice[] | null;
  invoice: ICredit | null;
  isLoading: boolean;
  error: null | string;
  status: string;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  creditSummary?: {
    totalAmount: number;
    totalCurrentDebt: number;
  };
}

export interface ICreditInvoicePayment {
  amount: number;
  note: string;
  credits_id: string | string[];
}

export interface ICurrentCredit {
  credit: ICredit | null;
  credit_detail: {
    client: string;
    amount: number;
    current_debt: number;
    status: string;
    created_at: string;
  };
  credits: ICredit[];
}
