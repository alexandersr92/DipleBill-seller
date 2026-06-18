import { ColumnDef } from '@tanstack/react-table';
import { IInventoryProductItem } from './types';
import InventoryActionsCell from './components/ActionsCell';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { AppBadge } from '../../components/ui/AppBadge';

export const columns: ColumnDef<IInventoryProductItem>[] = [
  {
    id: 'select',
    size: 40,
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: 'sku',
    header: 'SKU',
    size: 180
  },
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="hover:bg-transparent p-0 flex items-center gap-1"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Nombre
          <Icons.CaretSort />
        </Button>
      );
    },
    size: 300
  },
  {
    accessorKey: 'price',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="hover:bg-transparent p-0 flex items-center gap-1 w-full text-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Precio
          <Icons.CaretSort />
        </Button>
      );
    },
    cell: ({ row }) => {
      const price = row.original.price;
      return <div className="w-full text-center">{price}</div>;
    },
    size: 120
  },
  {
    accessorKey: 'quantity',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="hover:bg-transparent p-0 flex items-center gap-1 w-full text-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Existencia
          <Icons.CaretSort />
        </Button>
      );
    },
    cell: ({ row }) => {
      const quantity = row.original.quantity;
      return <div className="w-full flex justify-center items-center">{quantity}</div>;
    },
    size: 120
  },
  {
    accessorKey: 'status',
    header: () => <div className="w-full text-center">Estado</div>,
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <div className="w-full flex justify-center items-center">
          <AppBadge variant={status === 'active' ? 'success' : 'error'} className="min-w-12 ">
            {status === 'active' ? 'Activo' : 'Inactivo'}
          </AppBadge>
        </div>
      );
    },
    size: 120
  },
  {
    accessorKey: 'barcode',
    header: 'Codigo',
    cell: ({ row }) => {
      const barcode = row.original.barcode;
      return <div className="w-full">{barcode}</div>;
    },
    size: 200
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      return <InventoryActionsCell product_id={row.original.product_id} />;
    },
    size: 80,
    enableSorting: false,
    enableHiding: false
  }
];
