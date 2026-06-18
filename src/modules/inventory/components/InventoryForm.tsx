import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { yupResolver } from '@hookform/resolvers/yup';
import { Label } from '@radix-ui/react-label';
import { useForm } from 'react-hook-form';
import { InferType } from 'yup';
import { InventorySchema } from '../helpers/InventorySchema';
import { addInventory, editInventory } from '../services/inventoryThunks';
import { useToast } from '@/components/hooks/use-toast';
import { useEffect, useState } from 'react';
import { IEditInventory, IInventory } from '../types';
import { Loader2 } from 'lucide-react';
import { getInventoryByIdApi } from '../services/inventoryApi';
import FormSkeleton from './FormSkeleton';

type FormValues = InferType<typeof InventorySchema>;

interface InventoryProps {
  inventory?: IInventory;
  onSubmitSuccess: (createdId?: string) => void;
  defaultName?: string;
}
const InventoryForm = ({ onSubmitSuccess, inventory, defaultName }: InventoryProps) => {
  const store = useAppSelector((state) => state.storeSlice.store);
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [data, setData] = useState<IEditInventory | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getInventory = async (id: string) => {
    setIsLoading(true);
    const inventory = await getInventoryByIdApi(id);
    setData(inventory);
    setIsLoading(false);
  };

  useEffect(() => {
    if (inventory) {
      getInventory(inventory.id!);
    }
  }, [inventory]);

  const {
    register,
    handleSubmit,
    trigger,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    resolver: yupResolver(InventorySchema),
    defaultValues: async (): Promise<FormValues> => {
      if (data) {
        return {
          address: data.address,
          description: data.description,
          name: data.name
        };
      }

      return {
        address: '',
        description: '',
        name: defaultName ?? ''
      };
    },
    mode: 'onChange'
  });

  async function onSubmit(values: FormValues) {
    try {
      const newData = {
        name: values.name,
        store_id: store?.id ?? '',
        address: values.address,
        description: values.description
      };

      if (data && data.id) {
        await dispatch(editInventory({ id: data.id, ...newData })).unwrap();
        toast({
          title: 'Inventario actualizado exitosamente!',
          variant: 'success'
        });

        setTimeout(() => {
          onSubmitSuccess();
        }, 1200);
      } else {
        if (store?.id) {
          const result = await dispatch(addInventory(newData)).unwrap();
          toast({
            title: 'Inventario agregado exitosamente!',
            variant: 'success'
          });

          const createdId = (result as any)?.id;
          setTimeout(() => {
            onSubmitSuccess(createdId);
          }, 1200);
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);

      toast({
        title: `UPS!, Ha ocurrido un error al ${data ? 'actualizar este ' : 'agregar el'} inventario!`,
        variant: 'error'
      });
    }
  }

  useEffect(() => {
    if (data) {
      reset({
        address: data?.address ?? '',
        description: data?.description ?? '',
        name: data?.name ?? ''
      });
    }
  }, [data, reset]);

  useEffect(() => {
    if (!data) {
      trigger();
    }
  }, []);

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center h-full">
          <FormSkeleton />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2 mt-4">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              className="focus-visible:ring-0 focus-visible:ring-offset-0"
              id="name"
              placeholder="Nombre del inventario"
              required
              {...register('name')}
            />
            <div className="form-error-slot">
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              className="focus-visible:ring-0 focus-visible:ring-offset-0"
              id="description"
              placeholder="Descripción del inventario"
              required
              {...register('description')}
              disabled={isLoading}
            />
            <div className="form-error-slot">
              {errors.description && <p className="form-error">{errors.description.message}</p>}
            </div>
          </div>
          <div className="space-y-2 mt-4">
            <Label htmlFor="address">Dirección *</Label>
            <Input
              className="focus-visible:ring-0 focus-visible:ring-offset-0"
              id="address"
              placeholder="Dirección del inventario"
              required
              disabled={isLoading}
              {...register('address')}
            />
            <div className="form-error-slot">
              {errors.address && <p className="form-error">{errors.address.message}</p>}
            </div>
          </div>

          <div className="space-y-2 mt-4 justify-end flex">
            <Button type="submit" variant={'default'} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin w-4 h-4 mr-2" />}
              {data ? 'Actualizar Inventario' : 'Agregar Inventario'}
            </Button>
          </div>
        </form>
      )}
    </>
  );
};

export default InventoryForm;
