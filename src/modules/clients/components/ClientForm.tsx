import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, useForm } from 'react-hook-form';
import { ClientSchema } from '../helpers/clientSchema';

import { InferType } from 'yup';
import { addClient, editClient } from '../services/clientsThunks';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Icons } from '@/components/ui/icons';
import { TClientWithoutStores } from '../slices/client.types';
import { getClientByIdApi } from '../services/clientsApi';
import { useToast } from '@/components/hooks/use-toast';

type FormValues = InferType<typeof ClientSchema>;

type ClientIdProps = {
  id?: string;
  onSuccess?: () => void;
};

const ClientForm = ({ id, onSuccess }: ClientIdProps) => {
  const storeId = useAppSelector((state) => state.storeSlice.store?.id) ?? '';
  const { isLoading } = useAppSelector((state) => state.clientSlice);

  const [client, setClient] = useState<TClientWithoutStores>();
  const { toast } = useToast();

  const dispatch = useAppDispatch();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: yupResolver(ClientSchema),
    defaultValues: async (): Promise<any> => {
      if (id) {
        const response = await getClientByIdApi({ id });

        const responseWithoutStores = Object.fromEntries(
          Object.entries(response).filter(([key]) => key !== 'stores' && key !== 'status')
        );

        const normalizedResponse = {
          ...responseWithoutStores,
          wholesaler: response.wholesaler ?? false,
          has_credit: response.has_credit ?? false
        };

        setClient(response);
        return normalizedResponse;
      }

      return undefined;
    },
    mode: 'onChange'
  });

  function onSubmit(values: FormValues) {
    const dataClient = {
      ...values,
      stores: [storeId]
    };

    const editedClient = {
      id,
      ...values
    };

    if (client) {
      dispatch(editClient(editedClient))
        .unwrap()
        .then(() => {
          toast({
            title: 'El cliente ha sido actualizado exitosamente!',
            variant: 'success'
          });

          if (onSuccess && !isLoading) {
            setTimeout(() => {
              onSuccess();
            }, 1000);
          }
        })
        .catch(() => {
          toast({
            title: 'UPS!, Ha ocurrido un error al actualizar el cliente!',
            variant: 'error'
          });
        });
    } else {
      dispatch(addClient(dataClient))
        .unwrap()
        .then(() => {
          toast({
            title: 'El cliente ha sido agregado exitosamente!',
            variant: 'success'
          });

          if (onSuccess && !isLoading) {
            setTimeout(() => {
              onSuccess();
            }, 1000);
          }
        })
        .catch(() => {
          toast({
            title: 'UPS!, Ha ocurrido un error al agregar el cliente!',
            variant: 'error'
          });
        });
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2 mt-4">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            className="focus-visible:ring-0 focus-visible:ring-offset-0"
            id="name"
            placeholder="Nombre del cliente"
            required
            {...register('name')}
          />
          <div className="form-error-slot">
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <Label htmlFor="email">Correo electrónico *</Label>
          <Input
            className="focus-visible:ring-0 focus-visible:ring-offset-0"
            id="email"
            placeholder="correo@ejemplo.com"
            required
            {...register('email')}
          />
          <div className="form-error-slot">
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <Label htmlFor="phone">Teléfono *</Label>
          <Input
            className="focus-visible:ring-0 focus-visible:ring-offset-0"
            id="phone"
            type="tel"
            placeholder="8888-8888"
            required
            {...register('phone')}
          />

          <div className="form-error-slot">
            {errors.phone && <p className="form-error">{errors.phone.message}</p>}
          </div>
        </div>
        <div className="space-y-2 col-span-3 mt-4">
          <Label htmlFor="address">Dirección *</Label>
          <Input
            className="focus-visible:ring-0 focus-visible:ring-offset-0"
            id="address"
            placeholder="Dirección del cliente"
            required
            {...register('address')}
          />
          <div className="form-error-slot">
            {errors.address && <p className="form-error">{errors.address.message}</p>}
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <Label htmlFor="city">Ciudad *</Label>
          <Input
            className="focus-visible:ring-0 focus-visible:ring-offset-0"
            id="city"
            placeholder="Ciudad"
            required
            {...register('city')}
          />
          <div className="form-error-slot">
            {errors.city && <p className="form-error">{errors.city.message}</p>}
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <Label htmlFor="state">Municipio *</Label>
          <Input
            className="focus-visible:ring-0 focus-visible:ring-offset-0"
            id="state"
            placeholder="Municipio"
            {...register('state')}
            required
          />
          <div className="form-error-slot">
            {errors.state && <p className="form-error">{errors.state.message}</p>}
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <Label htmlFor="country">País *</Label>
          <Input
            className="focus-visible:ring-0 focus-visible:ring-offset-0"
            id="country"
            placeholder="País"
            required
            {...register('country')}
          />
          <div className="form-error-slot">
            {errors.country && <p className="form-error">{errors.country.message}</p>}
          </div>
        </div>

        <div className="flex gap-2 items-center mt-4">
          <Controller
            control={control}
            name="wholesaler"
            render={({ field }) => (
              <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
            )}
          />
          <label htmlFor="wholesaler" className="text-sm font-medium leading-none">
            Mayorista
          </label>
        </div>

        <div className="flex gap-2 items-center mt-4">
          <Controller
            control={control}
            name="has_credit"
            render={({ field }) => (
              <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
            )}
          />
          <label htmlFor="has_credit" className="text-sm font-medium leading-none">
            Crédito
          </label>
        </div>
        <div className="space-y-2 col-span-3 mt-4">
          <Label htmlFor="notes">Notas</Label>
          <Textarea
            id="notes"
            placeholder="Notas del cliente"
            className="min-h-[100px] focus-visible:ring-0 focus-visible:ring-offset-0"
            {...register('notes')}
          />
        </div>
        <div className="col-span-3 flex justify-end mt-4">
          <Button
            disabled={isLoading}
            type="submit"
            className="bg-secondary text-foreground hover:bg-primary hover:text-foreground"
          >
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            {client ? 'Actualizar' : 'Agregar'}
          </Button>
        </div>
      </form>
    </>
  );
};

export default ClientForm;
