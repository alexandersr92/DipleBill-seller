export interface IReport {
  id: string;
  name: string;
  type: string;
  status: string;
  file_path: string;
  created_at: string;
}

export interface IGetReportsParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  sort_by?: string;
  order?: 'asc' | 'desc';
  store_id?: string;
}

export interface IGetReportsResponse {
  data: IReport[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

export interface IGenerateReportPayload {
  type: string;
  date_from?: string;
  date_to?: string;
  store_id?: string;
}

export interface ReportsState {
  reports: IReport[];
  reportTypes: string[];
  isLoading: boolean;
  isGenerating: boolean;
  pagination: {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
  };
  error: string | null;
}

export const reportTypeTranslations: Record<string, string> = {
  invoices: 'Facturas',
  inventory: 'Inventario',
  sales: 'Ventas',
  expenses: 'Gastos',
  credits: 'Créditos'
};
