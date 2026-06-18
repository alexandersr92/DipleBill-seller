import { ColumnDef } from '@tanstack/react-table';
import { EditDialog } from '../edit-dialog';
import { DeleteButton } from '../delete-button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '../../../../components/ui/AppDropdownMenu';
import { useState } from 'react';
import { Button } from '../../../../components/ui/button';
import { Icons } from '../../../../components/ui/icons';
import { Dialog, DialogContent, DialogTrigger } from '../../../../components/ui/dialog';
import { AppBadge } from '../../../../components/ui/AppBadge';
const ActionsCell = ({ row }: { row: any }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDropdownClose = () => {
    setIsDropdownOpen(false);
  };

  const handleDialogOpen = () => {
    setIsDropdownOpen(false);
    setIsDialogOpen(true);
  };

  const supplier = row.original;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <Icons.DotsHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px] z-50" onClick={handleDropdownClose}>
          <DialogTrigger asChild onClick={handleDialogOpen}>
            <Button variant="ghost" className="w-full flex items-center justify-start gap-4">
              <Icons.pencil stroke="blue" />
              Editar
            </Button>
          </DialogTrigger>
          <DeleteButton supplier={supplier} />
        </DropdownMenuContent>
      </DropdownMenu>
      <DialogContent className="w-full max-w-[800px]">
        <EditDialog supplier={supplier} />
      </DialogContent>
    </Dialog>
  );
};

export const Columns: ColumnDef<SupplierData>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Nombre'
  },
  {
    accessorKey: 'city',
    header: 'Ciudad'
  },
  {
    accessorKey: 'state',
    header: 'Estado'
  },
  {
    accessorKey: 'status',
    header: () => <div className="text-center">Estado</div>,
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <div className="w-full flex justify-center items-center">
          <AppBadge variant={status === 'active' ? 'success' : 'error'}>
            {status === 'active' ? 'Activo' : 'Inactivo'}
          </AppBadge>
        </div>
      );
    }
  },
  {
    accessorKey: 'contact_count',
    header: 'Contactos'
  },
  {
    id: 'actions',
    cell: (props) => <ActionsCell {...props} />
  }
];
