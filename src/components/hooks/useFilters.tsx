import { format } from 'date-fns';
import { useCallback } from 'react';

interface FilterParams {
  searchTerm?: string;
  pageSize: number;
  page: number;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  [key: string]: any;
}

interface UseFiltersOptions<T> {
  defaultSort?: string;
  defaultOrder?: 'asc' | 'desc';
  dateFromField?: string;
  dateToField?: string;
  customParamMappings?: Record<string, string>; // Use this to tranform the key names
  storeId?: string; // Use this to add store_id
  store?: string; // Use this to add store_id
  customParams?: Record<string, any>; // Use this to add custom or specific params
  fetchFunction: (params: T) => void; // callback function to fetch data
}

export const useGenericFilters = <T extends Record<string, any>>({
  defaultSort = 'name',
  defaultOrder = 'desc',
  dateFromField = 'date_from',
  dateToField = 'date_to',
  storeId,
  store,
  customParamMappings = {},
  customParams,
  fetchFunction
}: UseFiltersOptions<T>) => {
  const getFilteredData = useCallback(
    (filters: FilterParams) => {
      const [sortField, sortOrder] = filters.sort
        ? filters.sort.split('_')
        : [defaultSort, defaultOrder];

      const params: any = {
        per_page: filters.pageSize,
        page: filters.page,
        sort_by: sortField,
        order: sortOrder,
        search: '',
        ...customParams
      };

      if (filters.searchTerm) {
        params.search = filters.searchTerm;
      }

      if (filters.dateRange?.start) {
        params[dateFromField] = format(filters.dateRange.start, 'yyyy-MM-dd');
      }

      if (filters.dateRange?.end) {
        params[dateToField] = format(filters.dateRange.end, 'yyyy-MM-dd');
      }

      if (storeId) {
        params.store_id = storeId;
      } else if (store) {
        params.store = store;
      }

      Object.keys(filters).forEach((key) => {
        if (
          !['searchTerm', 'pageSize', 'page', 'sort', 'dateRange', 'customParams'].includes(key)
        ) {
          const value = filters[key];
          if (value != null && value !== '' && value !== '--') {
            const paramKey = customParamMappings[key] || key;
            params[paramKey] = value;
          }
        }
      });

      fetchFunction(params as T);
    },
    [
      fetchFunction,
      defaultSort,
      defaultOrder,
      dateFromField,
      dateToField,
      customParamMappings,
      storeId,
      store,
      customParams
    ]
  );

  return { getFilteredData };
};
