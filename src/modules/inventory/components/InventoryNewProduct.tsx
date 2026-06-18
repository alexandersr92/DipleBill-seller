import { NewProductForm } from '@/modules/product/components/NewProductForm';
import { useParams } from 'react-router';

export const InventoryNewProduct = () => {
  const { id } = useParams<{ id: string }>();

  console.log('id', id);

  return <NewProductForm inventoryId={id} />;
};
