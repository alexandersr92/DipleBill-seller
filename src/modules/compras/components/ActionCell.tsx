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
import { useAppDispatch } from '../../../store/hooks';
import { deletePurchase } from '../slices/purchaseThunks';
import { deletePurchaseById } from '../slices/purchaseSlice';

interface ActionsCellProps {
  id: string;
}

const PurchaseActionsCell: React.FC<ActionsCellProps> = ({ id }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dispatch = useAppDispatch();

  const handleOpenDialog = () => {
    setIsModalOpen(true);
    setIsDropdownOpen(false);
  };

  return (
    <>
      <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setIsDropdownOpen(true)}>
              <span className="sr-only">Open menu</span>
              <Icons.DotsHorizontalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px] z-50">
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onClick={handleOpenDialog}
                className="flex w-full items-center justify-start gap-4 text-red-500 p-2 rounded-md transition-all duration-75 hover:bg-neutral-100">
                <Icons.trash className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </AlertDialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que quieres deshacer esta compra?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible.
              <br />
              Esto eliminará permanentemente este registro: <br />
              <span className="text-red-500">{id}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsModalOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                dispatch(deletePurchase(id));
                dispatch(deletePurchaseById(id));
                setIsModalOpen(false);
                setIsDropdownOpen(false);
              }}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PurchaseActionsCell;
