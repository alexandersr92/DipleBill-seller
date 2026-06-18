import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchStores } from '../../stores/slices/storeThunks';
import { createSeller, updateSeller, ISeller } from '../../sellers/services/sellerService';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { useToast } from '@/components/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const sellerSchema = (isNew: boolean) =>
  yup.object({
    name: yup.string().required('El nombre es requerido').max(255, 'Máximo 255 caracteres'),
    code: yup
      .string()
      .required('El código es requerido')
      .max(8, 'Máximo 8 caracteres')
      .matches(/^[A-Za-z0-9-]+$/, 'Solo letras, números y guiones (sin espacios)'),
    pin: isNew
      ? yup
          .string()
          .required('El PIN es requerido')
          .min(4, 'El PIN debe tener al menos 4 dígitos')
          .max(10, 'El PIN debe tener máximo 10 dígitos')
          .matches(/^\d+$/, 'El PIN debe ser numérico')
      : yup
          .string()
          .nullable()
          .transform((curr, orig) => (orig === '' ? null : curr))
          .test('len', 'El PIN debe tener entre 4 y 10 dígitos', (val) =>
            val ? val.length >= 4 && val.length <= 10 : true
          )
          .test('numeric', 'El PIN debe ser numérico', (val) =>
            val ? /^\d+$/.test(val) : true
          ),
    status: yup.string().required('El estado es requerido'),
    stores: yup
      .array()
      .of(yup.string().required())
      .min(1, 'Debes seleccionar al menos una tienda')
      .required('Debes seleccionar al menos una tienda')
  });

type SellerFormValues = yup.InferType<ReturnType<typeof sellerSchema>>;

interface SellerFormProps {
  seller?: ISeller | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function SellerForm({ seller, onSuccess, onCancel }: SellerFormProps) {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const storesList = useAppSelector((state) => state.storeSlice.stores);
  const isNew = !seller;

  useEffect(() => {
    if (storesList.length === 0) {
      dispatch(fetchStores());
    }
  }, [dispatch, storesList.length]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors }
  } = useForm<SellerFormValues>({
    resolver: yupResolver(sellerSchema(isNew)) as any,
    defaultValues: {
      name: seller?.name || '',
      code: seller?.code || '',
      pin: '',
      status: seller?.status || 'active',
      stores: seller?.stores?.map((s) => s.id) || []
    }
  });

  const selectedStores = watch('stores') || [];

  const handleStoreCheckboxChange = (storeId: string, checked: boolean) => {
    if (checked) {
      setValue('stores', [...selectedStores, storeId], { shouldValidate: true });
    } else {
      setValue(
        'stores',
        selectedStores.filter((id) => id !== storeId),
        { shouldValidate: true }
      );
    }
  };

  const onSubmit = async (values: SellerFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);

    // Formatear payload
    const payload = {
      name: values.name,
      code: values.code.toUpperCase(),
      status: values.status,
      stores: values.stores,
      pin: values.pin ? values.pin : undefined
    };

    try {
      if (isNew) {
        await createSeller(payload as any);
        toast({
          title: 'Vendedor creado',
          description: 'El vendedor ha sido registrado correctamente.',
          variant: 'success'
        });
      } else {
        await updateSeller(seller.id, payload as any);
        toast({
          title: 'Vendedor actualizado',
          description: 'Los datos del vendedor han sido guardados correctamente.',
          variant: 'success'
        });
      }
      onSuccess();
    } catch (error: any) {
      setErrorMessage(error.message || 'Ha ocurrido un error al guardar el vendedor.');
      toast({
        title: 'Error al guardar',
        description: error.message || 'Intente nuevamente.',
        variant: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-card border rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-6 text-foreground">
        {isNew ? 'Registrar Vendedor' : 'Editar Vendedor'}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nombre del Vendedor *</Label>
            <Input
              id="name"
              placeholder="Ej. Juan Pérez"
              disabled={isLoading}
              className="h-10"
              {...register('name')}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="code">Código de Facturación *</Label>
            <Input
              id="code"
              placeholder="Ej. VEND01"
              disabled={isLoading}
              maxLength={8}
              className="h-10 auto-uppercase"
              {...register('code', {
                onChange: (e) => {
                  e.target.value = e.target.value.toUpperCase();
                }
              })}
            />
            <p className="text-[10px] text-muted-foreground">Máximo 8 caracteres. Mayúsculas.</p>
            {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="pin">PIN de Seguridad {isNew ? '*' : '(Opcional)'}</Label>
            <Input
              id="pin"
              placeholder={isNew ? 'PIN de 4 a 10 dígitos' : '•••• (Vacío para mantener actual)'}
              type="password"
              disabled={isLoading}
              maxLength={10}
              className="h-10"
              {...register('pin')}
            />
            {errors.pin && <p className="text-xs text-destructive">{errors.pin.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="status">Estado *</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                  <SelectTrigger id="status" className="h-10">
                    <SelectValue placeholder="Seleccionar Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                    <SelectItem value="blocked">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t pt-4">
          <Label className="text-sm font-semibold mb-2">Asignar Tiendas *</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[180px] overflow-y-auto p-2 border rounded-md">
            {storesList.map((store) => (
              <div key={store.id} className="flex items-center space-x-2 p-1">
                <Checkbox
                  id={`store-${store.id}`}
                  checked={selectedStores.includes(store.id)}
                  onCheckedChange={(checked) =>
                    handleStoreCheckboxChange(store.id, checked === true)
                  }
                  disabled={isLoading}
                />
                <Label
                  htmlFor={`store-${store.id}`}
                  className="text-sm font-normal cursor-pointer select-none"
                >
                  {store.name}
                </Label>
              </div>
            ))}
          </div>
          {errors.stores && <p className="text-xs text-destructive">{errors.stores.message}</p>}
        </div>

        {errorMessage && (
          <div className="p-3 bg-destructive/15 border border-destructive/30 rounded-md text-sm text-destructive text-center">
            {errorMessage}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            {isNew ? 'Registrar Vendedor' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  );
}
