import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { storeSchema } from '../helpers/storeShema';
import { cn } from '../../../lib/utils';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Icons } from '../../../components/ui/icons';
import { countries } from '../helpers/countries';
import { PhoneInput } from '../../../components/ui/phone-input';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '../../../components/ui/command';
import {
  fetchProtectedStoreAsset,
  getStoreById,
  registerStore,
  updateStore,
  updateStoreLogo
} from '../services/storeService';
import { useAppDispatch } from '../../../store/hooks';

import { useToast } from '../../../components/hooks/use-toast';
import { fetchCurrentStore, fetchStores } from '../slices/storeThunks';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../../components/ui/select';
import { Separator } from '../../../components/ui/separator';
import { ICurrentStore } from '../slices/store.types';
import { Skeleton } from '../../../components/ui/skeleton';
import { Textarea } from '../../../components/ui/textarea';
import { currencies } from '../helpers/currencies';
import ImageUpload from '../../../components/ui/ImageUpload';
import type { StoreForm } from '../types/store.types';
import { getStoreLogoAsBase64 } from '../../billing/services/billingApi';

const printWidths = [
  { label: '58 mm', value: 48 },
  { label: '76 mm', value: 68 },
  { label: '80 mm', value: 72 }
];

const defaultStoreFormValues: StoreForm = {
  name: '',
  email: '',
  description: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  country: '',
  zip: '',
  print_logo: null,
  print_header: '',
  print_footer: '',
  print_note: '',
  print_width: String(printWidths[2].value),
  invoice_number: 1,
  invoice_prefix: '',
  store_currency: currencies[0].symbol
};
export type { StoreForm };

interface StoreFormProps {
  closeDialog?: () => void;
  storeId?: string;
  isNewStore: boolean;
}

export default function StoreForm({ closeDialog, storeId, isNewStore }: StoreFormProps) {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [store, setStore] = useState<ICurrentStore | null>(null);
  const [open, setOpen] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);

  const inferImageMimeType = (value?: string | null) => {
    const normalizedValue = value?.toLowerCase() ?? '';

    if (normalizedValue.endsWith('.svg')) return 'image/svg+xml';
    if (normalizedValue.endsWith('.png')) return 'image/png';
    if (normalizedValue.endsWith('.webp')) return 'image/webp';
    if (normalizedValue.endsWith('.gif')) return 'image/gif';
    if (normalizedValue.endsWith('.jpg') || normalizedValue.endsWith('.jpeg')) return 'image/jpeg';

    return 'image/jpeg';
  };

  const normalizeImageSource = (
    value?: string | null,
    fallbackName?: string | null
  ): string | null => {
    if (!value || typeof value !== 'string') return null;

    if (
      value.startsWith('data:image/') ||
      value.startsWith('http://') ||
      value.startsWith('https://') ||
      value.startsWith('blob:')
    ) {
      return value;
    }

    const compactValue = value.replace(/\s+/g, '');
    const looksLikeBase64 =
      /^[A-Za-z0-9+/]+={0,2}$/.test(compactValue) && compactValue.length > 100;

    if (looksLikeBase64) {
      return `data:${inferImageMimeType(fallbackName)};base64,${compactValue}`;
    }

    return null;
  };

  const blobToDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const fetchLogoPreview = async (url: string): Promise<string | null> => {
    try {
      const blob = await fetchProtectedStoreAsset(url);
      if (!blob) return null;

      return await blobToDataUrl(blob);
    } catch {
      return null;
    }
  };

  const resolveLogoPreview = async (
    nextStoreId: string,
    nextLogo?: string | File | null
  ): Promise<string | null> => {
    if (!nextLogo || typeof nextLogo !== 'string') return null;

    try {
      const base64Logo = await getStoreLogoAsBase64(nextStoreId);
      const normalizedBase64Logo = normalizeImageSource(base64Logo, nextLogo);
      if (normalizedBase64Logo) return normalizedBase64Logo;
    } catch {
      // fall through to direct normalization below
    }

    const normalizedLogoSource = normalizeImageSource(nextLogo, nextLogo);
    if (normalizedLogoSource) return normalizedLogoSource;

    try {
      const decodedLogo = decodeURIComponent(nextLogo);
      const normalizedDecodedLogo = normalizeImageSource(decodedLogo, nextLogo);
      if (normalizedDecodedLogo) return normalizedDecodedLogo;
    } catch {
      // ignore decode errors and continue to URL normalization below
    }

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const apiUrl = new URL(apiBaseUrl);
      const normalizedLogo = nextLogo.replace(/^\/+/, '');
      const candidateUrls = [
        new URL(normalizedLogo, `${apiUrl.origin}/`).toString(),
        new URL(`storage/${normalizedLogo}`, `${apiUrl.origin}/`).toString(),
        new URL(normalizedLogo, `${apiBaseUrl.replace(/\/+$/, '')}/`).toString()
      ];

      for (const candidateUrl of candidateUrls) {
        const preview = await fetchLogoPreview(candidateUrl);
        if (preview) return preview;
      }

      return null;
    } catch {
      return null;
    }
  };

  const getStore = async (storeId: string) => {
    const store = await getStoreById(storeId);
    setStore(store.data);
    setLogo(await resolveLogoPreview(storeId, store.data.print_logo));
  };
  useEffect(() => {
    if (storeId) getStore(storeId);
  }, [storeId]);

  const handleFileChange = async (file: File | null) => {
    if (!file) {
      setLogo(null);
      return;
    }
    const res = await updateStoreLogo(file, store!.id);
    setLogo(await resolveLogoPreview(store!.id, res.print_logo));
  };
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors }
  } = useForm<StoreForm>({
    mode: 'onChange',
    resolver: yupResolver(storeSchema),
    defaultValues: defaultStoreFormValues
  });

  useEffect(() => {
    if (store) {
      reset({
        name: store.name,
        email: store.email,
        description: store.description,
        phone: store.phone,
        address: store.address,
        city: store.city,
        state: store.state,
        country: store.country,
        zip: store.zip,
        invoice_number: store.invoice_number,
        invoice_prefix: store.invoice_prefix,
        print_footer: store.print_footer,
        print_header: store.print_header,
        print_logo: store.print_logo,
        print_note: store.print_note,
        print_width: store.print_width,
        store_currency: store.store_currency
      });
    }
  }, [store, isNewStore, reset]);

  const onSubmit = async (data: StoreForm) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Create store
      if (isNewStore) {
        const res = await registerStore(data);
        if (res.error) {
          if (res.error === 'Store name already exists') {
            setErrorMessage('El nombre de la tienda ya existe, intente con otro');
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
          if (closeDialog) closeDialog();
          toast({
            title: 'Registrar Tienda',
            description: 'Su tienda ha sido registrada con exito',
            variant: 'success'
          });
          dispatch(fetchCurrentStore(res.id));
          localStorage.setItem('currentStoreId', res.id);
          dispatch(fetchStores());
        }
      } else {
        // Update store
        const localStorageId = localStorage.getItem('currentStoreId');

        let body: StoreForm;

        if (!logo) {
          body = { ...data, print_logo: null };
        } else {
          body = { ...data };
          delete body.print_logo;
        }

        const res = await updateStore(body, store!.id);
        if (res) {
          if (storeId === localStorageId) {
            localStorage.setItem('currentStoreId', store!.id);
            dispatch(fetchCurrentStore(store!.id));
          }
          dispatch(fetchStores());
        }

        if (res.error) {
          if (res.error === 'Store name already exists') {
            setErrorMessage('El nombre de la tienda ya existe, intente con otro');
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
          if (closeDialog) closeDialog();
          toast({
            title: 'Actualizar Tienda',
            description: 'Su tienda ha sido actualizada con exito',
            variant: 'success'
          });
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      setIsLoading(false);
      reset();
      setErrorMessage('Ha ocurrido un error inesperado, intente de nuevo');
      toast({
        title: 'Error al guardar la tienda',
        description: 'Ha ocurrido un error inesperado, intente de nuevo.',
        variant: 'error'
      });
    }
  };

  if (!isNewStore && !store) {
    return <Skeleton className="h-screen w-full" />;
  }

  return (
    <div className={cn('grid gap-6')}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4">
          <div className="grid gap-4 mb-8">
            <div className="flex justify-between items-center w-full gap-4">
              <div className="w-1/2 relative">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  placeholder="Nombre de sucursal"
                  type="text"
                  disabled={isLoading}
                  {...register('name')}
                />
                <div className="form-error-slot">
                  {errors.name && <p className="form-error">{errors.name.message}</p>}
                </div>
              </div>

              <div className="w-1/2 relative">
                <Label htmlFor="email">Correo electrónico *</Label>
                <Input
                  id="email"
                  placeholder="Correo electronico de sucursal"
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
              </div>
            </div>

            <Label htmlFor="description">Descripción *</Label>
            <Input
              id="description"
              placeholder="Descripción"
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

            <div className="flex justify-between items-center w-full gap-4">
              <div className="w-1/2 relative">
                <Label htmlFor="phone">Teléfono *</Label>

                <Controller
                  control={control}
                  defaultValue=""
                  name="phone"
                  render={({ field }) => <PhoneInput defaultCountry="NI" {...field} />}
                />
                <div className="form-error-slot">
                  {errors.phone && <p className="form-error">{errors.phone.message}</p>}
                </div>
              </div>
              <div className="w-1/2 relative">
                <Label htmlFor="country">País *</Label>
                <Controller
                  control={control}
                  name="country"
                  defaultValue={store?.country || ''}
                  render={({ field }) => (
                    <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className={cn(
                            'w-full justify-between',
                            !field.value && 'text-muted-foreground',
                            errors.country && 'border-red-500/50'
                          )}
                        >
                          {countries.find((country) => country.value === field.value)?.label ||
                            'Seleccionar país'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Buscar País" />
                          <CommandList>
                            <CommandEmpty>No se encontró País</CommandEmpty>
                            <CommandGroup>
                              {countries.map((country) => (
                                <CommandItem
                                  key={country.value}
                                  value={country.value}
                                  onSelect={(value) => {
                                    field.onChange(value);
                                    setOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      field.value === country.value ? 'opacity-100' : 'opacity-0'
                                    )}
                                  />
                                  {country.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                />
                <div className="form-error-slot">
                  {errors.country && <p className="form-error">{errors.country.message}</p>}
                </div>
              </div>
            </div>

            <Label htmlFor="address">Dirección *</Label>
            <Input
              id="address"
              placeholder="Direccion de sucursal"
              type="text"
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              disabled={isLoading}
              {...register('address')}
            />
            <div className="form-error-slot">
              {errors.address && <p className="form-error">{errors.address.message}</p>}
            </div>

            <div className="flex items-center justify-between gap-4 ">
              <div className="w-1/2">
                <Label htmlFor="city">Ciudad *</Label>
                <Input
                  id="city"
                  placeholder="Ciudad"
                  type="text"
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect="off"
                  disabled={isLoading}
                  {...register('city')}
                />
                <div className="form-error-slot">
                  {errors.city && <p className="form-error">{errors.city.message}</p>}
                </div>
              </div>
              <div className="w-1/2">
                <Label htmlFor="state">Departamento *</Label>
                <Input
                  id="state"
                  placeholder="Departamento"
                  type="text"
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect="off"
                  disabled={isLoading}
                  {...register('state')}
                />
                <div className="form-error-slot">
                  {errors.state && <p className="form-error">{errors.state.message}</p>}
                </div>
              </div>

              <div className="w-1/2 relative">
                <Label htmlFor="zip">{'Codigo postal (opcional)'}</Label>
                <Input
                  id="zip"
                  placeholder={`Codigo postal(opcional)`}
                  type="text"
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect="off"
                  disabled={isLoading}
                  {...register('zip')}
                />
              </div>
            </div>

            <Separator className="my-2" />

            <div className="w-full flex  justify-between gap-4">
              <div className="w-1/2 relative">
                <ImageUpload
                  name="print_logo"
                  control={control}
                  label="Logo de Factura"
                  error={errors.print_logo}
                  setLogoState={handleFileChange}
                  image={logo}
                />
              </div>

              <div className="w-1/2 flex flex-col gap-4 items-center justify-center">
                <div className="w-full flex items-center gap-4 justify-center">
                  <div className="w-1/2">
                    <Label htmlFor="invoice_prefix">Prefijo de factura</Label>
                    <Input
                      id="invoice_prefix"
                      placeholder="Prefijo de factura"
                      type="text"
                      autoCapitalize="none"
                      autoComplete="off"
                      autoCorrect="off"
                      disabled={isLoading}
                      defaultValue={store?.invoice_prefix ? store.invoice_prefix : ''}
                      {...register('invoice_prefix')}
                    />
                  </div>
                  <div className="w-1/2">
                    <Label htmlFor="invoice_number">Numero inicial de factura</Label>
                    <Input
                      id="invoice_number"
                      placeholder="Numero de factura"
                      type="number"
                      autoComplete="off"
                      autoCorrect="off"
                      disabled={isLoading}
                      {...register('invoice_number', {
                        setValueAs: (value) => (value === '' ? null : Number(value))
                      })}
                    />
                  </div>
                </div>
                <div className="w-full">
                  <Label htmlFor="print_header">Encabezado de factura</Label>
                  <Input
                    id="print_header"
                    placeholder="Ingrese el encabezado de factura"
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    disabled={isLoading}
                    {...register('print_header')}
                  />
                </div>
                <div className="w-full">
                  <Label htmlFor="print_footer">Pie de factura</Label>
                  <Input
                    id="print_footer"
                    placeholder="Pie de Factura"
                    type="text"
                    autoComplete="off"
                    autoCorrect="off"
                    disabled={isLoading}
                    {...register('print_footer')}
                  />
                </div>
              </div>
            </div>
            <div className="w-full flex gap-3 ">
              <div className="w-1/2">
                <div className="w-full flex flex-col justify-center items-center gap-4">
                  <div className="w-full">
                    <Label htmlFor="store_currency">Moneda de tienda</Label>
                    <Controller
                      name="store_currency"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={String(field.value)}>
                          <SelectTrigger id="store_currency">
                            <SelectValue placeholder="Seleccionar moneda" />
                          </SelectTrigger>
                          <SelectContent>
                            {currencies.map((currency) => (
                              <SelectItem key={currency.code} value={String(currency.symbol)}>
                                {currency.name + ' - ' + currency.symbol}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="w-full">
                    <Label htmlFor="print_width">Ancho de factura</Label>
                    <Controller
                      name="print_width"
                      control={control}
                      rules={{ required: 'El ancho de factura es requerido' }}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={String(field.value)}>
                          <SelectTrigger id="print_width">
                            <SelectValue placeholder="Seleccionar ancho de factura" />
                          </SelectTrigger>
                          <SelectContent>
                            {printWidths.map((option) => (
                              <SelectItem key={option.value} value={String(option.value)}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              </div>
              <div className="w-1/2">
                <Label htmlFor="print_notes">{'Ingrese las notas de factura'}</Label>
                <Textarea
                  id="print_notes"
                  placeholder="Notas de factura"
                  autoComplete="off"
                  autoCorrect="off"
                  disabled={isLoading}
                  {...register('print_note')}
                  className="h-full"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 ">
            <Button type="submit">
              {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              {isNewStore ? 'Registrar Tienda' : 'Actualizar Tienda'}
            </Button>
          </div>

          {errorMessage && <span className="text-red-500 text-center">{errorMessage}</span>}
        </div>
      </form>
    </div>
  );
}
