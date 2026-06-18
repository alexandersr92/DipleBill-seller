import { DataTable } from '@/components/ui/data-table';
import { columns } from '../columns';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import Filters from '@/components/ui/Filters';
import InventoryExport from '../components/InventoryExport';
import { useNavigate, useParams } from 'react-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { IMetaRequestParams } from '@/modules/types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGenericFilters } from '@/components/hooks/useFilters';
import { getInventoryProducts } from '../services/inventoryThunks';
import { OnChangeFn, SortingState } from '@tanstack/react-table';
import { useDebounce } from '@/components/hooks/useDebounce';

const InventoryView = () => {
  const { id } = useParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const products = useAppSelector((state) => state.inventorySlice.inventory);
  const pagination = useAppSelector((state) => state.inventorySlice.inventory?.pagination);
  const isLoading = useAppSelector((state) => state.inventorySlice.isLoading);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearch = useDebounce(searchValue, 500);
  const storeId = useAppSelector((state) => state.storeSlice.store?.id);

  const isClearingFiltersRef = useRef(false);
  const isStoreChangeRef = useRef(false);
  const isPaginationRef = useRef(false);

  const { getFilteredData } = useGenericFilters({
    defaultSort: 'created_at',
    defaultOrder: 'desc',
    storeId: storeId,
    fetchFunction: (params: IMetaRequestParams) =>
      dispatch(getInventoryProducts({ id: id ?? '', params }))
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
      searchTerm: debouncedSearch,
      pageSize: pagination?.per_page ?? 20,
      page: 1,
      ...getSortParams()
    }),
    [debouncedSearch, pagination?.per_page, getSortParams]
  );

  useEffect(() => {
    if (!storeId) return;
    isStoreChangeRef.current = true;
    getFilteredData(filters);
  }, [storeId]);

  useEffect(() => {
    if (!storeId) return;

    if (isClearingFiltersRef.current) return;

    if (isStoreChangeRef.current) {
      isStoreChangeRef.current = false;
      return;
    }

    if (isPaginationRef.current) {
      isPaginationRef.current = false;
      return;
    }

    getFilteredData(filters);
  }, [filters]);

  const handlePaginationChange = useCallback(
    (page: number, pageSize: number) => {
      isPaginationRef.current = true;
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
    setSearchValue('');
  }, [pagination?.per_page, getSortParams]);

  const hasActiveFilters = Boolean(searchValue);
  const hasProducts = products ? products.details.length > 0 : false;

  return (
    <div className="w-full">
      <Button
        variant="ghost"
        className="mb-4 hover:bg-transparent pl-0"
        onClick={() => navigate('/inventories')}>
        <Icons.chevronDown className="mr-2 h-4 w-4" />
        Regresar
      </Button>
      <div className="w-full mb-4 flex justify-between">
        <div className="w-2/3 flex items-center gap-3">
          <Filters
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            searchPlaceholder="Buscar producto"
            hasActiveFilters={hasActiveFilters}
            onClearFilters={handleClearFilters}
          />
        </div>
        <div className="w-1/3 flex items-center gap-3 justify-end">
          {hasProducts && <InventoryExport id_inventory={id} />}
          <Button onClick={() => navigate(`/inventories/${id}/new-product`)}>Añadir nuevo</Button>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={products?.details ?? []}
        filter={searchValue}
        isLoading={isLoading}
        onPaginationChange={handlePaginationChange}
        pagination={{
          currentPage: pagination?.current_page ?? 1,
          itemsPerPage: pagination?.per_page ?? 10,
          totalItems: pagination?.total ?? 1,
          totalPages: pagination?.last_page ?? 1
        }}
        sorting={sorting}
        onSortingChange={handleSortingChange}
      />
    </div>
  );
};

export default InventoryView;
