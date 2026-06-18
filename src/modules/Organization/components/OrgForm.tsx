import { useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { cn } from '../../../lib/utils';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Icons } from '../../../components/ui/icons';
import { PhoneInput } from '../../../components/ui/phone-input';
import { organizationSchema } from '../helpers/OrgSchema';
import { regisgterOrg } from '../services/OrgServices';
import { setOrganizationId, setSellerId } from '../../auth/slices/userSlice';
import { useToast } from '@/components/hooks/use-toast';

import type { OrgForm } from '../types/org.types';
export type { OrgForm };

export default function OrgForm() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [logoState, setLogo] = useState<File | undefined>(undefined);

  const orgId = useAppSelector((state) => state.userSlice.orgId);

  useEffect(() => {
    if (orgId) {
      navigate('/');
    }
  }, [navigate, orgId]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors }
  } = useForm<OrgForm>({
    defaultValues: {
      name: '',
      description: '',
      phone: '',
      email: '',
      logo: undefined,
      website: ''
    },
    mode: 'onChange',
    resolver: yupResolver<OrgForm>(organizationSchema)
  });

  const onChange = (image: File) => {
    setLogo(image);
  };
  const onSubmit = async (data: OrgForm) => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);
    const body = {
      ...data,
      logo: logoState
    };

    try {
      const res = await regisgterOrg(body);
      if (res) {
        dispatch(setOrganizationId(res.id));
        dispatch(setSellerId(res.seller_id));
        setErrorMessage(null);
        toast({
          title: 'Organización registrada',
          description: 'Tu organización ha sido creada exitosamente.',
          variant: 'success'
        });
      }
    } catch (error) {
      setErrorMessage('Ha ocurrido un error inesperado, intena de nuevo');
      toast({
        title: 'Error al registrar',
        description: 'Ha ocurrido un error inesperado, intenta de nuevo.',
        variant: 'error'
      });
      if (import.meta.env.DEV) console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('grid gap-6')}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          <div className="grid gap-4 mb-8">
            <Label htmlFor="name">Nombre de empresa *</Label>
            <Input
              id="name"
              placeholder="Nombre de la empresa"
              type="text"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              disabled={isLoading}
              {...register('name')}
            />
            <div className="form-error-slot">
              {errors.name && <p className="form-error">{errors.name.message}</p>}
            </div>

            <Label htmlFor="email">Correo electrónico *</Label>
            <Input
              id="email"
              placeholder="correo@ejemplo.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              {...register('email')}
            />
            <div className="form-error-slot">
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <Label htmlFor="description">Descripción *</Label>
            <Input
              id="description"
              placeholder="Descripción de la empresa"
              type="text"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              disabled={isLoading}
              {...register('description')}
            />
            <div className="form-error-slot">
              {errors.description && <p className="form-error">{errors.description.message}</p>}
            </div>

            <Label htmlFor="phone">Teléfono *</Label>
            <Controller
              control={control}
              defaultValue={'NI'}
              name="phone"
              render={({ field }) => <PhoneInput defaultCountry={'NI'} {...field} />}
            />
            <div className="form-error-slot">
              {errors.phone && <p className="form-error">{errors.phone.message}</p>}
            </div>

            <Label htmlFor="logo">Logo</Label>
            <Input
              id="logo"
              placeholder="logo"
              type="file"
              disabled={isLoading}
              accept="image/png, image/jpeg, image/svg"
              {...register('logo')}
              onChange={(event) => {
                if (event.target.files) {
                  onChange(event.target.files[0]);
                }
              }}
            />

            <div className="form-error-slot">
              {errors.logo && <p className="form-error">{errors.logo.message}</p>}
            </div>

            <Label htmlFor="website">Sitio Web</Label>
            <Input
              id="website"
              placeholder="https://ejemplo.com"
              type="text"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              disabled={isLoading}
              {...register('website')}
            />
            <div className="form-error-slot">
              {errors.website && <p className="form-error">{errors.website.message}</p>}
            </div>

            <div className="flex flex-col gap-4 ">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                Registrar
              </Button>
            </div>

            {errorMessage && <span className="text-red-500 text-center">{errorMessage}</span>}
          </div>
        </div>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
      </div>
    </div>
  );
}
