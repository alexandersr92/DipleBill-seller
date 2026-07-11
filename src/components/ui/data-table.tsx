import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  SortingState,
  getSortedRowModel,
  OnChangeFn
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

import { useEffect, useMemo, useState } from 'react';
import { DataTablePagination } from './pagination';
import { DropdownMenu } from '@radix-ui/react-dropdown-menu';
import {
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger
} from './dropdown-menu';
import { Icons } from './icons';
import { Button } from './button';
import { Skeleton } from './skeleton';

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  toggleVisibility?: boolean;
  data: TData[];
  filter?: string;
  searchBy?: string;
  pagination?: PaginationInfo;
  onPaginationChange?: (page: number, pageSize: number) => void;
  isLoading?: boolean;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filter,
  toggleVisibility = false,
  searchBy,
  pagination,
  onPaginationChange,
  isLoading,
  sorting,
  onSortingChange
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const tableData = useMemo(() => (isLoading ? Array(10).fill({}) : data), [isLoading, data]);

  const tableColumns = useMemo(
    () =>
      isLoading
        ? columns.map((column) => {
            // if (column.id !== 'actions') {
            return {
              ...column,
              cell: () => <Skeleton className="h-[28px] w-full rounded-sm " />
            };
            // }

            // return column;
          })
        : columns,
    [isLoading]
  );

  const additionalConfig = {
    state: {
      sorting,
      columnFilters
    },
    manualPagination: pagination ? true : false,
    pageCount: pagination?.totalPages
  };

  const table = useReactTable({
    data: tableData,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onSortingChange,
    manualSorting: true,
    getSortedRowModel: getSortedRowModel(),
    ...additionalConfig
  });

  useEffect(() => {
    if (!searchBy) return;
    table.getColumn(searchBy)?.setFilterValue(filter);
  }, [filter, searchBy, table]);

  return (
    <div className="flex flex-col gap-3 w-full max-w-full overflow-hidden">
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <Table className="w-full rounded-xl">
            <TableHeader className="bg-secondary">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-secondary">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        style={{
                          width: `${header.getSize() === 150 ? 'auto' : header.getSize() + 'px'}`
                        }}
                        className="py-4 px-2 text-left whitespace-nowrap text-sm leading-6 font-semibold text-foreground capitalize">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="divide-y">
              {isLoading ? (
                Array.from({ length: 10 }).map((_, index) => (
                  <TableRow key={index}>
                    {columns.map((column, colIndex) => (
                      <TableCell key={colIndex}>
                        {column.id !== 'actions' ? (
                          <Skeleton className="h-[28px] w-full rounded-sm" />
                        ) : null}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="bg-background transition-all duration-500 hover:bg-secondary "
                    data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="p-2 whitespace-nowrap text-xs md:text-sm leading-6 font-medium text-foreground">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No hay resultados...
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className={`flex ${toggleVisibility ? 'justify-between' : 'justify-end'} items-center`}>
        {toggleVisibility && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="mb-10">
                Columnas <Icons.chevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}>
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <DataTablePagination
          table={table}
          pagination={pagination ? pagination : undefined}
          onPaginationChange={pagination ? onPaginationChange : undefined}
        />
      </div>
    </div>
  );
}
