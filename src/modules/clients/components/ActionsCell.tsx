import { useAppDispatch } from '@/store/hooks';
import { deleteClient } from '../services/clientsThunks';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenu,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import AppDialog from '@/components/ui/AppDialog';
import ClientForm from './ClientForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { ISingleClient } from '../types';
import { useToast } from '@/components/hooks/use-toast';
import { useState } from 'react';

interface ActionsCellProps {
  client: ISingleClient;
}

const ActionsCell: React.FC<ActionsCellProps> = ({ client }) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleOpenEditDialog = () => {
    setIsDropdownOpen(false);
    setIsEditDialogOpen(true);
  };

  const handleOpenDeleteDialog = () => {
    setIsDropdownOpen(false);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteClient = () => {
    if (client.id) {
      dispatch(deleteClient(client.id))
        .unwrap()
        .then(() => {
          toast({
            title: 'El cliente ha sido eliminado exitosamente!',
            variant: 'success'
          });
        })
        .catch(() => {
          toast({
            title: 'UPS!, Ha ocurrido un error al eliminar el cliente!',
            variant: 'error'
          });
        });
    }
  };

  return (
    <>
      <DropdownMenu onOpenChange={setIsDropdownOpen} open={isDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setIsDropdownOpen(true)}>
            <span className="sr-only">Open menu</span>
            <Icons.DotsHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="p-4 bg-background">
          <DropdownMenuItem onSelect={handleOpenEditDialog}>Editar</DropdownMenuItem>
          <DropdownMenuItem onClick={handleOpenDeleteDialog}>Eliminar</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AppDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen} title="Editar cliente">
        <ClientForm id={client.id} onSuccess={() => setIsEditDialogOpen(false)} />
      </AppDialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogTrigger></AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Estás seguro de que quieres eliminar este registro?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible.
              <br />
              Esto eliminará permanentemente este registro: <br />
              <span className="text-red-500">{client.name}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteClient}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ActionsCell;
