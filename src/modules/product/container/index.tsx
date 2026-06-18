import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { DataTable } from '@/components/ui/data-table';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { columns } from '../components/Columns';
import { getProducts } from '../slices/productThunks';
import Filters from '@/components/ui/Filters';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { useNavigate } from 'react-router';
import { useGenericFilters } from '@/components/hooks/useFilters';
import { IMetaRequestParams } from '@/modules/types';
import { OnChangeFn, SortingState } from '@tanstack/react-table';

export default function ProductPage() {
  const dispatch = useAppDispatch();
  const { products, isLoading, pagination } = useAppSelector((state) => state.productSlice);
  const store = useAppSelector((state) => state.storeSlice.store);
  const [searchValue, setSearchValue] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  const isClearingFiltersRef = useRef(false);
  const isStoreChangeRef = useRef(false);

  const navigate = useNavigate();

  const { getFilteredData } = useGenericFilters({
    defaultSort: 'created_at',
    defaultOrder: 'desc',
    customParams: {
      search_by: 'sku'
    },
    storeId: store?.id,
    fetchFunction: (params) => dispatch(getProducts(params as IMetaRequestParams))
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
      page: pagination.currentPage,
      ...getSortParams()
    }),
    [searchValue, pagination.itemsPerPage, getSortParams]
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

    // Se usa setTimeout para evitar que se ejecute inmediatamente y evitar multiples renderizados
    // se puede quitar cuando se implemente el axios abort controller
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
        pageSize: pagination.itemsPerPage,
        page: 1,
        ...getSortParams()
      });

      isClearingFiltersRef.current = false;
    }, 0);
  }, [pagination.itemsPerPage, getFilteredData, getSortParams]);

  const hasActiveFilters = Boolean(searchValue);

  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold mb-4">Productos</h1>

      <div className="w-full flex items-center justify-between py-2">
        <Filters
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        <Button
          className="flex items-center gap-1 text-white"
          onClick={() => navigate('/products/new')}>
          <Icons.plus /> Nuevo
        </Button>
      </div>

      <div className="overflow-x-auto">
        <DataTable
          searchBy="sku"
          columns={columns}
          data={products}
          filter={searchValue}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
          isLoading={isLoading}
          onSortingChange={handleSortingChange}
        />
      </div>
    </div>
  );
}
