import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DoubleArrowLeftIcon,
  DoubleArrowRightIcon
} from '@radix-ui/react-icons';
import { Table } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pagination?: PaginationInfo;
  onPaginationChange?: (page: number, pageSize: number) => void;
}

export function DataTablePagination<TData>({
  table,
  pagination,
  onPaginationChange
}: DataTablePaginationProps<TData>) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground"></div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Filas</p>
          <Select
            value={`${pagination ? pagination.itemsPerPage : table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              onPaginationChange
                ? onPaginationChange(1, Number(value))
                : table.setPageSize(Number(value));
            }}>
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue
                placeholder={
                  pagination ? pagination.itemsPerPage : table.getState().pagination.pageSize
                }
              />
            </SelectTrigger>
            <SelectContent side="top">
              {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-fit items-center justify-center text-sm font-medium">
          Página {pagination ? pagination.currentPage : table.getState().pagination.pageIndex + 1}{' '}
          de {pagination ? pagination.totalPages : table.getPageCount()}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() =>
              onPaginationChange && pagination
                ? onPaginationChange(1, pagination.itemsPerPage)
                : table.setPageIndex(0)
            }
            disabled={pagination ? pagination.currentPage === 1 : !table.getCanPreviousPage()}>
            <span className="sr-only">Ir a la primera página</span>
            <DoubleArrowLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() =>
              onPaginationChange && pagination
                ? onPaginationChange(pagination.currentPage - 1, pagination.itemsPerPage)
                : table.previousPage()
            }
            disabled={pagination ? pagination.currentPage === 1 : !table.getCanPreviousPage()}>
            <span className="sr-only">Ir a la página anterior</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() =>
              onPaginationChange && pagination
                ? onPaginationChange(pagination.currentPage + 1, pagination.itemsPerPage)
                : table.nextPage()
            }
            disabled={
              pagination
                ? pagination.currentPage === pagination.totalPages
                : !table.getCanNextPage()
            }>
            <span className="sr-only">Ir a la página siguiente</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() =>
              onPaginationChange && pagination
                ? onPaginationChange(pagination.totalPages, pagination.itemsPerPage)
                : table.setPageIndex(table.getPageCount() - 1)
            }
            disabled={
              pagination
                ? pagination.currentPage === pagination.totalPages
                : !table.getCanNextPage()
            }>
            <span className="sr-only">Ir a la última página</span>
            <DoubleArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
