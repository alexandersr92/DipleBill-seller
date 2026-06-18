import { useAppDispatch } from '@/store/hooks';
import { IProduct } from '../slices/initialState';
import { useToast } from '@/components/hooks/use-toast';
import { deleteProduct } from '../slices/productThunks';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';

type DeleteButtonProps = {
  product: IProduct;
};

export const DeleteButton = ({ product }: DeleteButtonProps) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const handleDeleteClick = async (id: string) => {
    try {
      await dispatch(deleteProduct(id)).unwrap();
      toast({
        title: 'Producto eliminado exitosamente!',
        variant: 'error'
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div>
      <Button
        variant="ghost"
        className="flex items-center gap-2"
        onClick={() => handleDeleteClick(product.id)}>
        <Icons.trash className="h-4 w-4 text-red-500" />
        <span>Eliminar</span>
      </Button>
    </div>
  );
};
