import { columns } from './columns';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import AppDialog from '@/components/ui/AppDialog';
import ClientForm from './components/ClientForm';
import { getClients } from './services/clientsThunks';
import { DataTable } from '@/components/ui/data-table';
import { useGenericFilters } from '@/components/hooks/useFilters';
import { IMetaRequestParams } from '../types';
import { OnChangeFn, SortingState } from '@tanstack/react-table';
import Filters from '@/components/ui/Filters';

export default function Clients() {
  const [searchValue, setSearchValue] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  const dispatch = useAppDispatch();
  const isClearingFiltersRef = useRef(false);
  const isStoreChangeRef = useRef(false);

  const { pagination, clients } = useAppSelector((state) => state.clientSlice);
  const isLoading = useAppSelector((state) => state.clientSlice.isLoading);

  const store = useAppSelector((state) => state.storeSlice.store);

  const [isOpen, setIsOpen] = useState(false);

  const { getFilteredData } = useGenericFilters({
    defaultOrder: 'desc',
    store: store?.id,
    fetchFunction: (params) => dispatch(getClients(params as IMetaRequestParams))
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
      pageSize: pagination.perPage,
      page: 1,
      ...getSortParams()
    }),
    [searchValue, pagination.perPage, getSortParams]
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
        ...getSortParams()
      });
    },
    [getFilteredData, searchValue, sorting, getSortParams]
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

    // Se usa settimeout para ejecutar los filtros una vez que los estados se limpien
    setTimeout(() => {
      getFilteredData({
        searchTerm: '',
        pageSize: pagination.perPage,
        page: 1,
        dateRange: {},
        paymentMethod: '',
        status: '',
        ...getSortParams()
      });

      isClearingFiltersRef.current = false;
    }, 0);
  }, [pagination.perPage, getFilteredData, getSortParams]);

  const hasActiveFilters = Boolean(searchValue);

  const handleSuccess = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div className="flex flex-col gap-3 mb-4">
        <div className="bg-transparent px-[18px] py-[14px] border border-secondary rounded-md flex items-center justify-between">
          <Filters
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            onClearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
          />

          <AppDialog
            open={isOpen}
            onOpenChange={setIsOpen}
            title="Agregar cliente"
            trigger={
              <Button variant="outline" className="flex items-center gap-1">
                <Icons.plus /> Nuevo
              </Button>
            }
          >
            <ClientForm onSuccess={handleSuccess} />
          </AppDialog>
        </div>
      </div>
      <div className="mb-4">
        <DataTable
          columns={columns}
          data={clients}
          filter={searchValue}
          pagination={{ itemsPerPage: pagination.perPage, ...pagination }}
          onPaginationChange={handlePaginationChange}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          isLoading={isLoading}
        />
      </div>
    </>
  );
}
