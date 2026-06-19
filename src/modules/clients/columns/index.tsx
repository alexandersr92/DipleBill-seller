import { ColumnDef } from '@tanstack/react-table';
import { ISingleClient } from '../types';
import ActionsCell from '../components/ActionsCell';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { AppBadge } from '../../../components/ui/AppBadge';

export const columns: ColumnDef<ISingleClient>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Nombre
          <Icons.CaretSort />
        </Button>
      );
    }
  },
  {
    accessorKey: 'phone',
    header: 'Teléfono'
  },
  {
    accessorKey: 'city',
    header: ({ column }) => {
      return (
        <Button
          className="pl-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Ciudad
          <Icons.CaretSort />
        </Button>
      );
    }
  },
  {
    accessorKey: 'state',
    header: ({ column }) => {
      return (
        <Button
          className="pl-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Municipio
          <Icons.CaretSort />
        </Button>
      );
    }
  },
  {
    accessorKey: 'has_credit',
    header: () => {
      return <div className="text-center">Crédito</div>;
    },
    cell: ({ row }) => {
      const has_credit = row.original.has_credit;
      return (
        <div className="w-full flex justify-center items-center">
          <AppBadge variant={has_credit ? 'success' : 'error'} className="min-w-12 ">
            {has_credit ? 'Si' : 'No'}
          </AppBadge>
        </div>
      );
    }
  },
  {
    accessorKey: 'wholesaler',
    header: () => {
      return <div className="text-center">Mayorista</div>;
    },
    cell: ({ row }) => {
      const isWholesaler = row.original.wholesaler;
      return (
        <div className="w-full flex justify-center items-center">
          <AppBadge variant={isWholesaler ? 'success' : 'error'} className="min-w-12 ">
            {isWholesaler ? 'Si' : 'No'}
          </AppBadge>
        </div>
      );
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <ActionsCell client={row.original} />
  }
];
