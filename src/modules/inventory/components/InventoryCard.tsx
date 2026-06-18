import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/ui/icons';
import { ChevronRight, Pencil, Trash } from 'lucide-react';
import { useState } from 'react';
import AppDialog from '../../../components/ui/AppDialog';
import InventoryForm from './InventoryForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '../../../components/ui/alert-dialog';
import { IInventory } from '../types';
import { useAppDispatch } from '../../../store/hooks';
import { deleteInventory } from '../services/inventoryThunks';
import { useToast } from '../../../components/hooks/use-toast';
import { useNavigate } from 'react-router';

interface IInventoryCardProps {
  inventory: IInventory;
}
const InventoryCard = ({ inventory }: IInventoryCardProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEdiDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleEditDialogOpen = () => {
    setIsDropdownOpen(false);
    setIsEditDialogOpen(true);
  };

  const handleDeleteDialogOpen = () => {
    setIsDropdownOpen(false);
    setIsDeleteDialogOpen(true);
  };

  const deleteInv = async (id: string) => {
    if (inventory.productsQuantity! > 0) {
      toast({
        title: 'No puedes eliminar un inventario con productos',
        variant: 'error'
      });
    } else {
      try {
        await dispatch(deleteInventory(id)).unwrap();
        toast({
          title: 'Inventario eliminado exitosamente!',
          variant: 'success'
        });
      } catch (error) {
        console.error(error);
        toast({
          title: 'UPS!, Hubo un error al eliminar este inventario!',
          variant: 'error'
        });
      }
    }
  };

  return (
    <Card key={inventory.id} className="min-h-40 min-w-96">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {inventory.store} | {inventory.name}
        </CardTitle>
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-secondary">
              <span className="sr-only">Abrir menu</span>
              <Icons.DotsHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-primary-foreground">
            <DropdownMenuItem onClick={handleEditDialogOpen}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDeleteDialogOpen}>
              <Trash className="mr-2 h-4 w-4" /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground flex gap-1">
          <Icons.PinIcon />
          {inventory.address}
        </p>

        <div className="text-2xl font-bold mt-4">{inventory.productsQuantity ?? 0} Productos</div>
      </CardContent>
      <CardFooter>
        <Button
          variant="ghost"
          className="w-full text-sm"
          onClick={() => navigate(`/inventories/${inventory.id}`)}>
          Ver Inventario
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>

      <AppDialog
        open={isEdiDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title={'Editar Inventario'}>
        <InventoryForm inventory={inventory} onSubmitSuccess={() => setIsEditDialogOpen(false)} />
      </AppDialog>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={() => setIsDeleteDialogOpen(!isDeleteDialogOpen)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Estás seguro de que quieres eliminar este inventario?
            </AlertDialogTitle>
            <AlertDialogDescription>Esta acción es irreversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteInv(inventory.id!);
              }}>
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default InventoryCard;
