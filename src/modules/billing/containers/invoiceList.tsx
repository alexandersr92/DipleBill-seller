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
import { format } from 'date-fns';

type FilterScope = 'current_shift' | 'today' | 'all';

const InvoiceList = () => {
  const [searchValue, setSearchValue] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const { invoices, pagination } = useAppSelector((state) => state.billingSlice);
  const isLoading = useAppSelector((state) => state.billingSlice.isLoading);
  const store = useAppSelector((state) => state.storeSlice.store);
  const { activeSession } = useAppSelector((state) => state.cashSlice);

  const activeSessionId =
    activeSession?.id || localStorage.getItem('active_cash_session_id') || undefined;

  const dispatch = useAppDispatch();
  const isClearingFiltersRef = useRef(false);
  const isStoreChangeRef = useRef(false);

  const [filterScope, setFilterScope] = useState<FilterScope>(() =>
    activeSessionId ? 'current_shift' : 'today'
  );
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [showExport, setShowExport] = useState(false);
  const [viewType, setViewType] = useState<'invoices' | 'proformas'>('invoices');

  const todayRange = useMemo(() => {
    const today = new Date();
    return {
      start: today,
      end: today
    };
  }, []);

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

  const effectiveDateRange = useMemo(() => {
    if (filterScope === 'today') {
      return todayRange;
    }
    if (filterScope === 'current_shift') {
      return {};
    }
    return dateRange;
  }, [filterScope, todayRange, dateRange]);

  const effectiveCashSessionId = useMemo(() => {
    if (filterScope === 'current_shift' && viewType === 'invoices') {
      return activeSessionId;
    }
    return undefined;
  }, [filterScope, viewType, activeSessionId]);

  const filters = useMemo(
    () => ({
      searchTerm: searchValue,
      pageSize: pagination.itemsPerPage,
      page: 1,
      dateRange: effectiveDateRange,
      paymentMethod,
      status: viewType === 'proformas' ? 'proforma' : status,
      cash_session_id: effectiveCashSessionId,
      ...getSortParams()
    }),
    [
      searchValue,
      pagination.itemsPerPage,
      effectiveDateRange,
      paymentMethod,
      status,
      viewType,
      effectiveCashSessionId,
      getSortParams
    ]
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
    }, 400);

    return () => clearTimeout(debounceTimer);
  }, [filters]);

  const handlePaginationChange = useCallback(
    (page: number, pageSize: number) => {
      getFilteredData({
        searchTerm: searchValue,
        pageSize,
        page,
        dateRange: effectiveDateRange,
        paymentMethod,
        status: viewType === 'proformas' ? 'proforma' : status,
        cash_session_id: effectiveCashSessionId,
        ...getSortParams()
      });
    },
    [
      getFilteredData,
      searchValue,
      effectiveDateRange,
      paymentMethod,
      status,
      viewType,
      effectiveCashSessionId,
      getSortParams
    ]
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
    const defaultScope: FilterScope = activeSessionId ? 'current_shift' : 'today';
    setFilterScope(defaultScope);

    setTimeout(() => {
      getFilteredData({
        searchTerm: '',
        pageSize: pagination.itemsPerPage,
        page: 1,
        dateRange: defaultScope === 'today' ? todayRange : {},
        paymentMethod: '',
        status: viewType === 'proformas' ? 'proforma' : '',
        cash_session_id:
          defaultScope === 'current_shift' && viewType === 'invoices' ? activeSessionId : undefined,
        ...getSortParams()
      });

      isClearingFiltersRef.current = false;
    }, 0);
  }, [pagination.itemsPerPage, getFilteredData, getSortParams, viewType, activeSessionId, todayRange]);

  const hasActiveFilters = Boolean(
    searchValue ||
      (filterScope === 'all' && (dateRange.start || dateRange.end)) ||
      status ||
      paymentMethod
  );

  return (
    <section>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Facturas y Proformas</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filterScope === 'current_shift'
              ? 'Mostrando facturas del turno de caja actual'
              : filterScope === 'today'
                ? `Mostrando facturas emitidas hoy (${format(new Date(), 'dd/MM/yyyy')})`
                : 'Mostrando historial general de facturación'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Alcance (Caja Actual / Hoy / Historial) */}
          <div className="flex bg-muted/80 p-1 rounded-lg text-xs font-semibold">
            {activeSessionId && viewType === 'invoices' && (
              <button
                type="button"
                onClick={() => {
                  setFilterScope('current_shift');
                  setDateRange({});
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  filterScope === 'current_shift'
                    ? 'bg-background text-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Caja Actual
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setFilterScope('today');
                setDateRange({});
              }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filterScope === 'today'
                  ? 'bg-background text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Hoy ({format(new Date(), 'dd/MM')})
            </button>

            <button
              type="button"
              onClick={() => {
                setFilterScope('all');
              }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                filterScope === 'all'
                  ? 'bg-background text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Historial
            </button>
          </div>

          {/* Selector Facturas / Proformas */}
          <div className="flex bg-muted/80 p-1 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setViewType('invoices');
                setStatus('');
              }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewType === 'invoices'
                  ? 'bg-background text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Facturas
            </button>
            <button
              type="button"
              onClick={() => {
                setViewType('proformas');
                setStatus('proforma');
              }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                viewType === 'proformas'
                  ? 'bg-background text-foreground shadow-xs font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Proformas
            </button>
          </div>
        </div>
      </div>

      <div className="py-2 flex items-center justify-between">
        <Filters
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          dateRange={filterScope === 'all' ? dateRange : undefined}
          onDateRangeChange={(range) => {
            setDateRange({
              start: range.start,
              end: range.end
            });
            setFilterScope('all');
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

      <div className="overflow-x-auto">
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
