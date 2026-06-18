import { useParams } from 'react-router-dom';
import { NewProductForm } from './NewProductForm';

export const EditProductForm = () => {
  const { id } = useParams<{ id: string }>();

  return <NewProductForm isEditing={true} productId={id} />;
};
