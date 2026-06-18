import { NewProductForm } from '@/modules/product/components/NewProductForm';
import { useParams } from 'react-router';

export const EditInventoryProduct = () => {
  const { id, productId } = useParams<{ id: string; productId: string }>();

  return <NewProductForm inventoryId={id} productId={productId} isEditing={true} />;
};
