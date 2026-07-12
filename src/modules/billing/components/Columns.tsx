import { ColumnDef } from '@tanstack/react-table';
import { ISingleInvoice, PAYMENT_METHODS } from '@diplebill/core';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';

import InvoiceListActions from './InvoiceListActions';
import { AppBadge } from '@/components/ui/AppBadge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';

const INVOICE_STATUS: Record<
  string,
  {
    value: string;
    label: string;
    variant:
      | 'success'
      | 'warning'
      | 'error'
      | 'info'
      | 'neutral'
      | 'processing'
      | 'draft'
      | 'paused';
  }
> = {
  COMPLETED: {
    value: 'completed',
    label: 'Pagada',
    variant: 'success'
  },
  CANCELED: {
    value: 'canceled',
    label: 'Anulada',
    variant: 'error'
  },
  CREDIT: {
    value: 'credit',
    label: 'Credito',
    variant: 'processing'
  }
};

export const columns: ColumnDef<ISingleInvoice>[] = [
  {
    accessorKey: 'invoice_number',
    header: 'Nº Factura',
    cell: ({ row }) => (
      <div className="text-left">
        <Link to={`${row.original.id}`} className="hover:underline hover:text-theme_blue">
          {row.getValue('invoice_number')}
        </Link>
      </div>
    )
  },
  {
    accessorKey: 'client_name',
    header: ({ column }) => {
      return (
        <Button
          className="pl-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Cliente
          <Icons.CaretSort />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-left">
        <Link to={`${row.original.id}`} className="hover:underline hover:text-theme_blue">
          {row.getValue('client_name')}
        </Link>
      </div>
    )
  },
  {
    accessorKey: 'grand_total',
    header: ({ column }) => {
      return (
        <Button
          className="pl-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Monto Total
          <Icons.CaretSort />
        </Button>
      );
    },
    cell: ({ row }) => <div className="text-left">C$ {row.getValue('grand_total')}</div>
  },
  {
    accessorKey: 'method',
    header: ({ column }) => {
      return (
        <Button
          className="pl-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Metódo
          <Icons.CaretSort />
        </Button>
      );
    },
    cell: ({ row }) => {
      const method = row.original.method;

      return (
        <div className="text-left capitalize">
          {method === PAYMENT_METHODS.EFECTIVO ? 'Efectivo' : 'Transferencia'}
        </div>
      );
    }
  },
  {
    accessorKey: 'invoice_status',
    header: ({ column }) => {
      return (
        <Button
          className="mx-auto flex justify-center"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Estado
          <Icons.CaretSort />
        </Button>
      );
    },
    cell: ({ row }) => {
      const status = row.original.invoice_status;

      let statusConfig;

      switch (status) {
        case INVOICE_STATUS.COMPLETED.value:
          statusConfig = INVOICE_STATUS.COMPLETED;
          break;
        case INVOICE_STATUS.CANCELED.value:
          statusConfig = INVOICE_STATUS.CANCELED;
          break;
        case INVOICE_STATUS.CREDIT.value:
          statusConfig = INVOICE_STATUS.CREDIT;
          break;
        default:
          statusConfig = INVOICE_STATUS.CANCELED;
      }

      return (
        <AppBadge variant={statusConfig.variant} className="mx-auto flex w-fit">
          {statusConfig.label}
        </AppBadge>
      );
    }
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => {
      return (
        <Button
          className="pl-0"
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Fecha
          <Icons.CaretSort />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue('created_at') ?? new Date();
      const formattedDate = format(date as string, "d 'de' MMMM, yyyy", { locale: es });

      return <div className="text-left">{formattedDate}</div>;
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const id = row.original.id;
      if (id) {
        return <InvoiceListActions id={id} />;
      } else {
        return null;
      }
    }
  }
];
