import { ColumnDef } from '@tanstack/react-table';
import { IProduct } from '../slices/initialState';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { DeleteButton } from './DeleteButton';
import { Link } from 'react-router-dom';

export const columns: ColumnDef<IProduct>[] = [
  {
    accessorKey: 'sku',
    header: 'SKU',
    cell: ({ row }) => <div className="hidden md:block text-left">{row.getValue('sku')}</div>
  },
  {
    accessorKey: 'name',
    header: 'Producto',
    cell: ({ row }) => <div className="font-medium text-left">{row.getValue('name')}</div>
  },
  {
    accessorKey: 'categories',
    header: 'Categoría',
    cell: ({ row }) => {
      const categories = row.original.categories;
      return (
        <div className="hidden sm:block text-left">
          {categories.length > 0 ? categories[0].name : 'N/A'}
        </div>
      );
    }
  },
  {
    accessorKey: 'price',
    header: 'Precio de venta',
    cell: ({ row }) => <div className="text-left">{row.getValue('price')}</div>,
    sortingFn: (rowA, rowB, columnId) => {
      const a = parseFloat(rowA.getValue(columnId));
      const b = parseFloat(rowB.getValue(columnId));
      return a < b ? -1 : a > b ? 1 : 0;
    }
  },
  {
    accessorKey: 'stock',
    header: 'Existencia',
    cell: ({ row }) => <div className="hidden sm:block text-left">{row.getValue('stock')}</div>
  },
  {
    accessorKey: 'unit_of_measure',
    header: 'Unidad',
    cell: ({ row }) => (
      <div className="hidden lg:block text-left">{row.getValue('unit_of_measure')}</div>
    )
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const product = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <Icons.DotsHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Button variant="ghost" className="flex items-center gap-2" asChild>
                <Link to={`/products/edit/${product.id}`}>
                  <Icons.pencil stroke="#0000ff" className="h-4 w-4" />
                  <span>Editar</span>
                </Link>
              </Button>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <DeleteButton product={product} />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  }
];
