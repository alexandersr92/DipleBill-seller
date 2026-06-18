import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OnChangeFn, SortingState } from '@tanstack/react-table';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import AppDialog from '@/components/ui/AppDialog';
import { DataTable } from '@/components/ui/data-table';
import Filters from '@/components/ui/Filters';
import { useGenericFilters } from '@/components/hooks/useFilters';
import ReportForm from '../components/ReportForm';
import { columns } from '../columns';
import { getReports } from '../services/reportsThunks';
import { IGetReportsParams } from '../types';

export default function Reports() {
  const [searchValue, setSearchValue] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isOpen, setIsOpen] = useState(false);

  const dispatch = useAppDispatch();
  const isClearingFiltersRef = useRef(false);

  const { pagination, reports, isLoading } = useAppSelector((state) => state.reportsSlice);
  const storeId = useAppSelector((state) => state.storeSlice.store?.id);

  const { getFilteredData } = useGenericFilters({
    storeId,
    defaultOrder: 'desc',
    fetchFunction: (params) => dispatch(getReports(params as IGetReportsParams))
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
    [searchValue, pagination.perPage, getSortParams, storeId]
  );

  useEffect(() => {
    if (!storeId) return;
    if (isClearingFiltersRef.current) return;

    const debounceTimer = setTimeout(() => {
      getFilteredData(filters);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [filters, storeId]);

  const handlePaginationChange = useCallback(
    (page: number, pageSize: number) => {
      getFilteredData({
        searchTerm: searchValue,
        pageSize,
        page,
        ...getSortParams()
      });
    },
    [getFilteredData, searchValue, getSortParams]
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

    setTimeout(() => {
      getFilteredData({
        searchTerm: '',
        pageSize: pagination.perPage,
        page: 1,
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
        <h1 className="text-2xl font-bold tracking-tight">Módulo de Reportes</h1>
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
            title="Generar Nuevo Reporte"
            trigger={
              <Button variant="default" className="flex items-center gap-1">
                <Icons.plus className="w-4 h-4" /> Generar Reporte
              </Button>
            }
          >
            <ReportForm onSuccess={handleSuccess} />
          </AppDialog>
        </div>
      </div>
      <div className="mb-4">
        <DataTable
          columns={columns}
          data={reports}
          filter={searchValue}
          pagination={{
            itemsPerPage: pagination.perPage,
            totalPages: pagination.lastPage,
            totalItems: pagination.total,
            currentPage: pagination.currentPage
          }}
          onPaginationChange={handlePaginationChange}
          sorting={sorting}
          onSortingChange={handleSortingChange}
          isLoading={isLoading}
        />
      </div>
    </>
  );
}
