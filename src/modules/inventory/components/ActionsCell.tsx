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
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/ui/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppSelector } from '@/store/hooks';
import { Pencil, Trash } from 'lucide-react';

interface ActionsCellProps {
  product_id: string;
}

const InventoryActionsCell: React.FC<ActionsCellProps> = ({ product_id }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const inventoryId = useAppSelector((state) => state.inventorySlice.inventory?.inventory.id);

  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleOpenDeleteDialog = () => {
    setIsDropdownOpen(false);
    setIsDeleteDialogOpen(true);
  };

  return (
    <>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-secondary">
              <span className="sr-only">Abrir menu</span>
              <Icons.DotsHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-primary-foreground">
            <DropdownMenuItem
              className='cursor-pointer'
              onClick={() => navigate(`/inventories/${inventoryId}/edit-product/${product_id}`)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600 focus:text-white focus:bg-red-600 cursor-pointer"
              onClick={handleOpenDeleteDialog}>
              <Trash className="mr-2 h-4 w-4" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
              <span className="text-red-500"></span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {}}>Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default InventoryActionsCell;
