import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { useAppDispatch } from '@/store/hooks';
import { deleteSupplier } from '../../services/supplierThunks';
import { useToast } from '@/components/hooks/use-toast';

type DeleteButtonProps = {
  supplier: SupplierData;
};

export const DeleteButton = ({ supplier }: DeleteButtonProps) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const handleDeleteClick = async (id: string) => {
    if (supplier.status === 'inactive') {
      toast({
        title: 'El proveedor ya está deshabilitado!',
        description: 'No se puede eliminar un proveedor que ya está deshabilitado.',
        variant: 'warning'
      });
      return;
    }

    try {
      await dispatch(deleteSupplier(id)).unwrap();
      toast({
        title: 'Proveedor eliminado exitosamente!',
        variant: 'error'
      });
    } catch (error) {
      console.log(error);
      toast({
        title: 'UPS!, Ha ocurrido un error al eliminar el proveedor!',
        variant: 'warning'
      });
    }
  };
  return (
    <div className="w-full flex items-center">
      <Button
        variant="ghost"
        onClick={() => handleDeleteClick(supplier.id)}
        className="w-full flex items-center justify-start gap-4">
        <Icons.trash />
        Eliminar
      </Button>
    </div>
  );
};
