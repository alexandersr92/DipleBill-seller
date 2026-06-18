import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SupplierForm } from '../../forms/supplier';

type AddSupplierTabProps = {
  onSubmitSupplier: (data: SupplierForm) => Promise<void>;
};

export const AddSupplierTab = ({ onSubmitSupplier }: AddSupplierTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Proveedores</CardTitle>
        <CardDescription>Añade un nuevo proveedor.</CardDescription>
      </CardHeader>
      <CardContent>
        <SupplierForm onSubmit={onSubmitSupplier} />
      </CardContent>
    </Card>
  );
};
