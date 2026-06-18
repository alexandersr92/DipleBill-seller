import { DataTable } from '@/components/ui/data-table';
import { useCallback, useEffect, useState } from 'react';
import { columns } from '../components/Columns';
import Filters from '@/components/ui/Filters';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useGenericFilters } from '@/components/hooks/useFilters';
import { getCredits } from '../services/creditsThunks';
import { IMetaRequestParams } from '@/modules/types';

export default function PaidCredits() {
  const [searchValue, setSearchValue] = useState('');
  const credits = useAppSelector((state) => state.creditsSlice.credits);
  const store = useAppSelector((state) => state.storeSlice.store);
  const [creditStatus] = useState('paid');

  const { isLoading, pagination } = useAppSelector((state) => state.creditsSlice);

  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});

  const dispatch = useAppDispatch();

  const { getFilteredData } = useGenericFilters({
    defaultSort: 'created_at',
    defaultOrder: 'desc',
    dateFromField: 'date_from',
    dateToField: 'date_to',
    storeId: store?.id,
    customParams: {
      credit_status: creditStatus,
      search_by: 'client'
    },
    fetchFunction: (params) => dispatch(getCredits(params as IMetaRequestParams))
  });

  const handleFilterChange = useCallback(() => {
    getFilteredData({
      searchTerm: searchValue,
      pageSize: pagination.itemsPerPage,
      page: 1,
      dateRange
    });
  }, [searchValue, dateRange]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleFilterChange();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [handleFilterChange]);

  const handlePaginationChange = useCallback(
    (page: number, pageSize: number) => {
      getFilteredData({
        searchTerm: searchValue,
        pageSize,
        page,
        sort: '',
        dateRange
      });
    },
    [getFilteredData, searchValue, dateRange]
  );

  const handleClearFilters = useCallback(() => {
    setSearchValue('');
    setDateRange({});
  }, []);

  const hasActiveFilters = Boolean(searchValue || dateRange.start || dateRange.end);

  return (
    <section>
      <h1 className="text-2xl font-semibold mb-4">Todos los créditos pagados</h1>
      <div className="py-[14px] flex items-center justify-between ">
        <Filters
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      <div className="overflow-x-auto">
        <DataTable
          columns={columns}
          data={credits}
          isLoading={isLoading}
          searchBy="client"
          onPaginationChange={handlePaginationChange}
        />
      </div>
    </section>
  );
}
