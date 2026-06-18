import { ColumnDef } from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import { ICreditBase } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const columns: ColumnDef<ICreditBase>[] = [
  {
    accessorKey: 'client',
    header: 'Cliente',
    cell: ({ row }) => (
      <div className="text-left text-accent-foreground hover:underline">
        <Link to={`${row.original.client_id}`}>{row.original.client_name}</Link>
      </div>
    )
  },
  {
    accessorKey: 'total_items',
    header: () => <div className="text-center">Facturas</div>,
    cell: ({ row }) => <div className="text-center">{row.original.invoices_qty}</div>
  },
  {
    accessorKey: 'created_at',
    header: () => <div className="text-right normal-case">Fecha de creación</div>,
    cell: ({ row }) => (
      <div className="text-right">
        {format(row.original.created_at, "d 'de' MMMM, yyyy", { locale: es })}
      </div>
    )
  },
  {
    accessorKey: 'total_credit',
    header: () => <div className="text-right">Crédito Pendiente</div>,
    cell: ({ row }) => <div className="text-right">C$ {row.original.total_debt}</div>
  }
];
