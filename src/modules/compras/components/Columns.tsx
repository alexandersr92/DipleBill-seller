import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { IPurchaseItem } from '../types/compras.types';
import PurchaseActionsCell from './ActionCell';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export const columns: ColumnDef<IPurchaseItem>[] = [
  {
    accessorKey: 'store',
    header: 'Tienda',
    size: 300,
    cell: ({ row }) => (
      <div className="text-left">
        <Link to={`/compras/${row.original.id}`}>{row.getValue('store')}</Link>
      </div>
    )
  },
  {
    accessorKey: 'inventory',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="hover:bg-transparent p-0 flex items-center gap-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Inventario
          <Icons.CaretSort />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-left">
        <Link to={`/compras/${row.original.id}`}>{row.getValue('inventory')}</Link>
      </div>
    ),
    size: 300
  },
  {
    accessorKey: 'total_items',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="hover:bg-transparent p-0 flex items-center gap-1 w-full text-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Items Totales
          <Icons.CaretSort />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-center">
        <Link to={`/compras/${row.original.id}`}>{row.getValue('total_items')}</Link>
      </div>
    ),
    size: 100
  },

  {
    accessorKey: 'purchase_date',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="hover:bg-transparent p-0 flex items-center gap-1 w-full text-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Fecha de Compra
          <Icons.CaretSort />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <Link to={`/compras/${row.original.id}`} className="w-full block text-center">
          {format(row.getValue('purchase_date'), "d 'de' MMMM, yyyy", { locale: es })}
        </Link>
      );
    }
  },

  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      return <PurchaseActionsCell id={row.original.id} />;
    },
    enableSorting: false,
    enableHiding: false
  }
];
