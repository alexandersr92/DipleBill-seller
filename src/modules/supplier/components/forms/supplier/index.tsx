import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supplierSchema, supplierUpdateSchema } from '@/modules/supplier/helpers/schemas';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';

interface SupplierFormProps {
  onSubmit: (data: SupplierForm) => void;
  isEdit?: boolean;
  initialValues?: Partial<SupplierFullData>;
}

export const SupplierForm = ({ onSubmit, isEdit, initialValues }: SupplierFormProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<SupplierForm | SupplierUpdateForm>({
    resolver: yupResolver<SupplierForm | SupplierUpdateForm>(
      isEdit ? supplierUpdateSchema : supplierSchema
    ),
    mode: 'onChange'
  });

  useEffect(() => {
    if (initialValues) {
      reset(initialValues);
    } else {
      reset({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: '',
        country: '',
        notes: ''
      });
    }
  }, [isEdit, initialValues, reset]);

  const handleFormSubmit = (data: SupplierForm) => {
    if (isEdit) {
      onSubmit(data);
    } else {
      onSubmit(data);
      reset();
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 w-full">
      <div className="space-y-1">
        <Label htmlFor="nombre">Nombre *</Label>
        <Input type="text" id="nombre" {...register('name')} />
        <div className="form-error-slot">
          {errors.name && <p className="form-error">{errors.name.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="telefono">Teléfono *</Label>
          <Input type="tel" id="telefono" {...register('phone')} />
          <div className="form-error-slot">
            {errors.phone && <p className="form-error">{errors.phone.message}</p>}
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="correo">Correo electrónico *</Label>
          <Input type="email" id="correo" {...register('email')} />
          <div className="form-error-slot">
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="direccion">Dirección *</Label>
        <Input type="text" id="direccion" {...register('address')} />
        <div className="form-error-slot">
          {errors.address && <p className="form-error">{errors.address.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label htmlFor="municipio">Municipio *</Label>
          <Input type="text" id="municipio" {...register('city')} />
          <div className="form-error-slot">
            {errors.city && <p className="form-error">{errors.city.message}</p>}
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="departamento">Departamento *</Label>
          <Input type="text" id="departamento" {...register('state')} />
          <div className="form-error-slot">
            {errors.state && <p className="form-error">{errors.state.message}</p>}
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="pais">País *</Label>
          <Input type="text" id="pais" {...register('country')} />
          <div className="form-error-slot">
            {errors.country && <p className="form-error">{errors.country.message}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="notas">Notas</Label>
        <Input type="text" id="notas" {...register('notes')} />
        <div className="form-error-slot">
          {errors.notes && <p className="form-error">{errors.notes.message}</p>}
        </div>
      </div>

      <Button type="submit">{isEdit ? 'Actualizar proveedor' : 'Agregar proveedor'}</Button>
    </form>
  );
};
