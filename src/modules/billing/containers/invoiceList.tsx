import { DataTable } from '@/components/ui/data-table';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { columns } from '../components/Columns';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import Filters from '@/components/ui/Filters';
import { useGenericFilters } from '@/components/hooks/useFilters';
import { getAllInvoices } from '../services/billingThunks';
import { IMetaRequestParams } from '@diplebill/core';
import { OnChangeFn, SortingState } from '@tanstack/react-table';
import InvoicesExport from '../components/InvoicesExport';

const InvoiceList = () => {
  const [searchValue, setSearchValue] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const { invoices, pagination } = useAppSelector((state) => state.billingSlice);
  const isLoading = useAppSelector((state) => state.billingSlice.isLoading);
  const store = useAppSelector((state) => state.storeSlice.store);

  const dispatch = useAppDispatch();
  const isClearingFiltersRef = useRef(false);
  const isStoreChangeRef = useRef(false);

  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [showExport, setShowExport] = useState(false);
  const [viewType, setViewType] = useState<'invoices' | 'proformas'>('invoices');

  const { getFilteredData } = useGenericFilters({
    defaultSort: 'created_at',
    defaultOrder: 'desc',
    dateFromField: 'date_from',
    dateToField: 'date_to',
    customParamMappings: {
      paymentMethod: 'method',
      status: 'invoice_status'
    },
    customParams: {
      search_by: 'invoice_number'
    },
    storeId: store?.id,
    fetchFunction: (params) => dispatch(getAllInvoices(params as IMetaRequestParams))
  });

  const getSortParams = useCallback(() => {
    if (sorting.length > 0) {
      const { id, desc } = sorting[0];
      return {
        sort_by: id,
        order: desc ? 'desc' : 'asc'
      };
    }
    return {};
  }, [sorting]);

  const filters = useMemo(
    () => ({
      searchTerm: searchValue,
      pageSize: pagination.itemsPerPage,
      page: 1,
      dateRange,
      paymentMethod,
      status,
      ...getSortParams()
    }),
    [searchValue, pagination.itemsPerPage, dateRange, paymentMethod, status, getSortParams]
  );

  useEffect(() => {
    if (!store) return;
    isStoreChangeRef.current = true;
    getFilteredData(filters);
  }, [store]);

  useEffect(() => {
    if (isClearingFiltersRef.current) return;

    if (isStoreChangeRef.current) {
      isStoreChangeRef.current = false;
      return;
    }

    const debounceTimer = setTimeout(() => {
      getFilteredData(filters);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [filters]);

  const handlePaginationChange = useCallback(
    (page: number, pageSize: number) => {
      getFilteredData({
        searchTerm: searchValue,
        pageSize,
        page,
        dateRange,
        paymentMethod,
        status,
        ...getSortParams()
      });
    },
    [getFilteredData, searchValue, sorting, dateRange, paymentMethod, status, getSortParams]
  );

  const handleSortingChange: OnChangeFn<SortingState> = useCallback(
    (updater) => {
      const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(newSorting);
    },
    [sorting]
  );

  const handleClearFilters = useCallback(() => {
    isClearingFiltersRef.current = true;

    setSearchValue('');
    setDateRange({});
    setStatus(viewType === 'proformas' ? 'proforma' : '');
    setPaymentMethod('');

    // Se usa settimeout para ejecutar los filtros una vez que los estados se limpien
    setTimeout(() => {
      getFilteredData({
        searchTerm: '',
        pageSize: pagination.itemsPerPage,
        page: 1,
        dateRange: {},
        paymentMethod: '',
        status: viewType === 'proformas' ? 'proforma' : '',
        ...getSortParams()
      });

      isClearingFiltersRef.current = false;
    }, 0);
  }, [pagination.itemsPerPage, getFilteredData, getSortParams, viewType]);

  const hasActiveFilters = Boolean(
    searchValue || dateRange.start || dateRange.end || status || paymentMethod
  );

  return (
    <section>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold ">Facturas y Proformas</h1>
        <div className="flex gap-2 bg-muted p-1 rounded-lg">
          <button
            onClick={() => {
              setViewType('invoices');
              setStatus('');
              getFilteredData({ ...filters, status: '' });
            }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewType === 'invoices'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Facturas de Venta
          </button>
          <button
            onClick={() => {
              setViewType('proformas');
              setStatus('proforma');
              getFilteredData({ ...filters, status: 'proforma' });
            }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewType === 'proformas'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Proformas
          </button>
        </div>
      </div>
      <div className="py-[14px] flex items-center justify-between">
        <Filters
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          dateRange={dateRange}
          onDateRangeChange={(range) => {
            setDateRange({
              start: range.start,
              end: range.end
            });
            setShowExport(true);
          }}
          customFilter={
            viewType === 'proformas'
              ? [
                  {
                    options: [
                      { value: '--', label: 'Todos' },
                      { value: 'PROFORMA', label: 'Proforma' }
                    ],
                    selectedValue: paymentMethod,
                    placeholder: 'Seleccionar Método...',
                    onChange(value) {
                      setPaymentMethod(value);
                    }
                  }
                ]
              : [
                  {
                    options: [
                      { value: '--', label: 'Todos' },
                      { value: 'CASH', label: 'Efectivo' },
                      { value: 'BACS', label: 'Transferencia' }
                    ],
                    selectedValue: paymentMethod,
                    placeholder: 'Seleccionar Método...',
                    onChange(value) {
                      setPaymentMethod(value);
                    }
                  },
                  {
                    options: [
                      { value: '--', label: 'Todos' },
                      { value: 'completed', label: 'Completado' },
                      { value: 'pending', label: 'Pendiente' },
                      { value: 'failed', label: 'Fallido' },
                      { value: 'canceled', label: 'Cancelado' }
                    ],
                    selectedValue: status,
                    placeholder: 'Seleccionar Estado',
                    onChange(value) {
                      setStatus(value);
                    }
                  }
                ]
          }
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />
        {showExport && <InvoicesExport data={invoices} />}
      </div>

      <div className="overflow-x-auto ">
        <DataTable
          columns={columns}
          data={invoices}
          filter={searchValue}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          isLoading={isLoading}
          sorting={sorting}
          onSortingChange={handleSortingChange}
        />
      </div>
    </section>
  );
};

export default InvoiceList;
