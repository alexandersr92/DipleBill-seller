import axios from 'axios';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import { Textarea } from '@/components/ui/textarea';
import ProductTable from '../components/ProductTable';
import { SaleTypeToggle } from '../components/SaleTypeToggle';
import { ConfirmSaleModal } from '../components/ConfirmSaleModal';
import { PinLockOverlay } from '../components/PinLockOverlay';
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { billingSchema } from '../helpers/billingSchema';
import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { InferType } from 'yup';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { createBilling } from '../services/billingThunks';
import { IInvoice, IInvoiceProduct, ISingleInvoice, SELL_TYPES, PAYMENT_METHODS } from '../types';
import { useToast } from '@/components/hooks/use-toast';
import { clearInvoice, resetProductsInvoice, updateInvoice } from '../slices/billingSlice';
import { addClientFromInvoice, getClients } from '@/modules/clients/services/clientsThunks';
import { handleKeyDown } from '../helpers';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import SearchSelect from '../../../components/ui/SearchSelect';
import { ActionButtons } from '../components/ActionButtons';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type FormValues = InferType<typeof billingSchema>;

// We already have the products in the exact order the cashier typed them
// (`productsSelected` in Redux). The server response is only consulted for
// fields the server owns (invoice_number, etc.); `invoice_details` is rebuilt
// locally so the printed receipt always matches what's on screen.
const buildInvoiceDetailsFromSelectedProducts = (
  invoice: ISingleInvoice,
  selectedProducts: IInvoiceProduct[]
): ISingleInvoice => {
  if (!selectedProducts.length) return invoice;

  return {
    ...invoice,
    invoice_details: selectedProducts.map((product) => ({
      id: product.temp_id ?? '',
      product_id: product.product_id,
      product_name: product.name,
      inventory_id: product.inventory_id ?? '',
      quantity: product.quantity,
      price: product.price as never,
      total: product.total,
      sku: product.sku ?? ''
    }))
  };
};

const Billing = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const clientTriggerRef = useRef<HTMLButtonElement>(null);
  const sellTypeTriggerRef = useRef<HTMLButtonElement>(null);
  const expirationButtonRef = useRef<HTMLButtonElement>(null);
  const paymentMethodTriggerRef = useRef<HTMLButtonElement>(null);
  const invoiceNoteRef = useRef<HTMLTextAreaElement | null>(null);
  const productSearchRef = useRef<HTMLInputElement>(null);
  const printDialogButtonRef = useRef<HTMLButtonElement>(null);
  const downloadDialogButtonRef = useRef<HTMLButtonElement>(null);

  const { toast } = useToast();

  const currentUser = useAppSelector((state) => state.userSlice);
  const storeId =
    useAppSelector((state) => state.storeSlice.store?.id) ||
    localStorage.getItem('currentStoreId') ||
    '';
  const invoiceCreated = useAppSelector((state) => state.billingSlice.invoice);
  const clients = useAppSelector((state) => state.clientSlice.clients);
  const productsSelected = useAppSelector((state) => state.billingSlice.productsSelected);

  const [sellType, setSellType] = useState<string>('contado');
  const [isClientSelected, setIsClientSelected] = useState<boolean>(false);
  const [isOpenDialogAfterInvoice, setIsOpenDialogAfterInvoice] = useState<boolean>(false);
  const [invoiceRecentCreated, setInvoiceRecentCreated] = useState<ISingleInvoice>();
  const [confirmSaleOpen, setConfirmSaleOpen] = useState<boolean>(false);
  const [pendingFormValues, setPendingFormValues] = useState<FormValues | null>(null);
  const [isSubmittingSale, setIsSubmittingSale] = useState<boolean>(false);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isClientSelected) {
      setSellType(SELL_TYPES.CONTADO);
    }
  }, [isClientSelected]);

  const focusElement = (element?: HTMLElement | null) => {
    if (!element) return;

    window.setTimeout(() => {
      element.focus();

      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.select();
      }
    }, 0);
  };

  // NOTE: per_page is capped at 2000 to load the full client list into the combobox
  // for client-side filtering. If a store exceeds 2000 clients, refactor this to
  // server-side search with virtualization (e.g., react-window) in RecordsCombobox
  // to avoid truncated results and DOM/render perf issues.
  const handleSearchClients = async (value: string) => {
    await dispatch(
      getClients({
        page: 1,
        per_page: 2000,
        sort: 'name',
        order: 'asc',
        search: value,
        search_by: 'name',
        store_id: storeId
      })
    );
  };

  const handleCancelInvoice = () => {
    clearForm();
    focusElement(clientTriggerRef.current);
  };

  useEffect(() => {
    const promise = dispatch(
      getClients({
        page: 1,
        per_page: 2000,
        sort: 'name',
        order: 'asc',
        search: '',
        search_by: 'name',
        store_id: storeId
      })
    );

    return () => {
      promise.abort();
    };
  }, [storeId, dispatch]);

  const { register, handleSubmit, control, setValue, getValues, watch } = useForm<FormValues>({
    resolver: yupResolver(billingSchema)
  });
  const invoiceNoteField = register('invoice_note');

  useEffect(() => {
    const subscription = watch((values) => {
      const sanitizedValues = {
        ...values,
        invoice_expiration: values.invoice_expiration
          ? new Date(values.invoice_expiration).toISOString().split('T')[0]
          : ''
      };
      dispatch(updateInvoice(sanitizedValues as any));
    });

    return () => subscription.unsubscribe();
  }, [watch, dispatch]);

  const clearForm = () => {
    setSellType(SELL_TYPES.CONTADO);
    setIsClientSelected(false);
    setValue('invoice_date', new Date().toString(), { shouldValidate: true });
    setValue('invoice_expiration', new Date().toString(), { shouldValidate: true });
    setValue('invoice_note', '', { shouldValidate: true });
    setValue('isCredit', false, { shouldValidate: true });
    setValue('client_id', null, { shouldValidate: true });
    setValue('client_name', null, { shouldValidate: true });
    setValue('payment_method', PAYMENT_METHODS.EFECTIVO, { shouldValidate: true });
    dispatch(resetProductsInvoice());
    dispatch(clearInvoice());
    setIsUnlocked(false);
  };

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    if (!currentUser.sellerId) return;
    if (isSubmittingSale) return;
    if (!storeId) {
      toast({
        title:
          'Error: No se ha seleccionado una tienda o sucursal activa. Intente recargar la página.',
        variant: 'error'
      });
      return;
    }
    if (invoiceCreated.products.length === 0) {
      toast({
        title: 'Debes seleccionar almenos un producto para realizar la venta!',
        variant: 'error'
      });
      return;
    }
    setPendingFormValues(values);
    setConfirmSaleOpen(true);
  };

  const handleConfirmedSubmit = async () => {
    if (isSubmittingSale) return;
    if (!pendingFormValues || !currentUser.sellerId) {
      setConfirmSaleOpen(false);
      return;
    }

    setIsSubmittingSale(true);
    const values = pendingFormValues;
    const dateExp = values.invoice_expiration ? new Date(values.invoice_expiration) : new Date();
    const invoice: IInvoice = {
      ...invoiceCreated,
      invoice_date: format(new Date(), 'yyyy-MM-dd'),
      store_id: storeId!,
      payment_method: values.payment_method ?? PAYMENT_METHODS.EFECTIVO,
      payment_date: format(dateExp, 'yyyy-MM-dd'),
      seller_id: currentUser.sellerId,
      products: productsSelected.map((product) => ({
        ...product,
        inventory_id: product.inventory_id ?? ''
      }))
    };

    try {
      const response = await dispatch(createBilling(invoice as any)).unwrap();
      const orderedInvoice = buildInvoiceDetailsFromSelectedProducts(
        response.data,
        productsSelected
      );

      toast({
        title: 'Venta realizada exitosamente!',
        variant: 'success'
      });

      clearForm();
      setIsOpenDialogAfterInvoice(true);
      setInvoiceRecentCreated(orderedInvoice);
    } catch (error: unknown) {
      if (import.meta.env.DEV) console.error(error);
      if (axios.isAxiosError(error) && error.response?.data) {
        const { quantity_available, product_name, quantity_requested } = error.response.data;

        if (quantity_available <= 0) {
          toast({
            title: `No hay stock del producto "${product_name}" y se solicitó ${quantity_requested}`,
            variant: 'error'
          });
        }
      } else {
        toast({
          title: 'Hubo un error al realizar la venta!',
          variant: 'error'
        });
      }
    } finally {
      setConfirmSaleOpen(false);
      setPendingFormValues(null);
      setIsSubmittingSale(false);
    }
  };

  const addNewClient: (name: string) => Promise<any> = async (name: string) => {
    if (!name) return;

    const client = {
      name,
      wholesaler: false,
      stores: [storeId ?? '']
    };

    try {
      const response = await dispatch(addClientFromInvoice(client)).unwrap();

      setValue('client_id', response.id, { shouldValidate: true });
      setValue('client_name', response.name, { shouldValidate: true });
      setIsClientSelected(true);

      return response;
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      toast({
        title: 'Error al agregar cliente',
        description: 'No se pudo agregar el cliente. Intente nuevamente.',
        variant: 'error'
      });
      throw error;
    }
  };

  useEffect(() => {
    if (!isOpenDialogAfterInvoice) return;

    const handleDialogShortcuts = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        printDialogButtonRef.current?.click();
      }

      if (event.key.toLowerCase() === 'd') {
        event.preventDefault();
        downloadDialogButtonRef.current?.click();
      }
    };

    window.addEventListener('keydown', handleDialogShortcuts);

    return () => {
      window.removeEventListener('keydown', handleDialogShortcuts);
    };
  }, [isOpenDialogAfterInvoice]);

  return (
    <div className="relative">
      {!isUnlocked && (
        <PinLockOverlay
          onUnlock={() => {
            setIsUnlocked(true);
            focusElement(clientTriggerRef.current);
          }}
        />
      )}

      <form
        ref={formRef}
        data-sell-type={sellType}
        onKeyDown={(e) => handleKeyDown({ event: e, formRef, buttonRef })}
        onSubmit={handleSubmit(onSubmit)}
      >
        <section className="relative rounded-md shadow-md p-4 border mb-4 before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-sale-accent-strong before:rounded-t-md">
          <div className="w-2/5 text-sm">
            <h1 className="text-2xl font-bold">Nueva factura</h1>
            <p className="mt-2">
              Por favor, complete el formulario a continuación con los detalles necesarios para
              generar su nueva factura.
            </p>
            <p>Asegúrese de incluir toda la información requerida.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="w-full flex flex-wrap">
              <Label htmlFor="client_id">Agregar Cliente *</Label>

              <Controller
                control={control}
                name="client_id"
                render={({ field }) => (
                  <SearchSelect
                    id="client_id"
                    triggerRef={clientTriggerRef}
                    items={clients}
                    selectedItem={getValues('client_name')!}
                    onSelect={(client) => {
                      setValue('client_id', client.id);
                      setValue('client_name', client.name);
                      setIsClientSelected(true);
                    }}
                    onAfterSelect={() => focusElement(sellTypeTriggerRef.current)}
                    placeholder="Seleccionar Cliente"
                    searchPlaceholder="Buscar Cliente"
                    field={field}
                    getCallback={handleSearchClients}
                    addRecord={addNewClient}
                  />
                )}
              />
            </div>

            <div className="w-full flex flex-wrap">
              <Label htmlFor="invoice_date">Fecha de la factura *</Label>
              <Controller
                name="invoice_date"
                control={control}
                render={() => (
                  <DatePicker
                    id="invoice_date"
                    disabled={true}
                    dateSelected={true}
                    value={new Date()}
                    className="w-full h-10 bg-transparent"
                  />
                )}
              />
            </div>

            <div className="w-full flex gap-2 sm:flex-wrap lg:flex-nowrap">
              <div className="sm:w-full lg:w-1/2">
                <Label htmlFor="sell_type">Tipo de venta</Label>
                <div
                  key={sellType === SELL_TYPES.CREDITO ? 'credito-pulse' : 'contado-pulse'}
                  className={sellType === SELL_TYPES.CREDITO ? 'pulse-once-accent rounded-md' : ''}
                >
                  <SaleTypeToggle
                    id="sell_type"
                    tabIndex={1}
                    triggerRef={sellTypeTriggerRef}
                    value={sellType}
                    disabled={!isClientSelected}
                    onChange={(value) => {
                      setSellType(value);
                      setValue('isCredit', value === SELL_TYPES.CREDITO, {
                        shouldValidate: true
                      });
                      if (value === SELL_TYPES.CREDITO) {
                        focusElement(expirationButtonRef.current);
                        return;
                      }
                      focusElement(paymentMethodTriggerRef.current);
                    }}
                  />
                </div>
              </div>
              <div className="sm:w-full lg:w-1/2">
                <Label htmlFor="invoice_expiration">Fecha de vencimiento</Label>
                <Controller
                  name="invoice_expiration"
                  control={control}
                  render={({ field }) => {
                    const expirationDate = field.value ? new Date(field.value) : new Date();
                    if (!field.value) {
                      expirationDate.setDate(expirationDate.getDate() + 5);
                    }

                    return (
                      <DatePicker
                        buttonRef={expirationButtonRef}
                        id="invoice_expiration"
                        tabIndex={1}
                        value={expirationDate}
                        onChange={(value) => {
                          field.onChange(value);
                          focusElement(paymentMethodTriggerRef.current);
                        }}
                        className={cn(
                          'w-full h-10 bg-transparent focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue',
                          sellType === SELL_TYPES.CREDITO ? 'border-sale-accent/60' : 'opacity-50'
                        )}
                      />
                    );
                  }}
                />
              </div>
            </div>

            <div className="w-full flex gap-2 sm:flex-wrap lg:flex-nowrap">
              <div className="sm:w-full lg:w-1/2">
                <Label htmlFor="payment_method">Metódo de pago</Label>
                <Controller
                  name="payment_method"
                  control={control}
                  defaultValue={PAYMENT_METHODS.EFECTIVO} // Valor predeterminado si lo necesitas
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={(value) => {
                        field.onChange(value);
                        focusElement(invoiceNoteRef.current);
                      }}
                    >
                      <SelectTrigger
                        ref={paymentMethodTriggerRef}
                        id="payment_method"
                        tabIndex={1}
                        data-enter-behavior="native"
                        className="w-full h-10 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue"
                      >
                        <SelectValue placeholder="Seleccionar método de pago" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PAYMENT_METHODS.EFECTIVO}>Efectivo</SelectItem>
                        <SelectItem value={PAYMENT_METHODS.TRANSFERENCIA}>Transferencia</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="sm:w-full lg:w-1/2">
                <Label htmlFor="seller">Vendedor</Label>
                <Input id="seller" readOnly disabled className="h-10" value={currentUser.email} />
                <Input type="hidden" {...register('seller_id')} value={currentUser.id || ''} />
              </div>
            </div>

            <div className="w-full xl:col-span-1 sm:col-span-2 flex gap-2 flex-wrap items-start flex-col">
              <Label htmlFor="invoice_note">Detalles de la factura</Label>
              <Textarea
                id="invoice_note"
                tabIndex={4}
                data-enter-next="#product-search"
                className="h-10 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue"
                {...invoiceNoteField}
                ref={(node) => {
                  invoiceNoteField.ref(node);
                  invoiceNoteRef.current = node;
                }}
              />
            </div>
          </div>
        </section>

        <section className="relative rounded-md shadow-md p-4 border before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-sale-accent-strong before:rounded-t-md">
          <ProductTable sellType={sellType} productSearchRef={productSearchRef} />

          <div className="border-t pt-4 w-full flex justify-end gap-3 items-center">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    tabIndex={-1}
                    ref={buttonRef}
                    disabled={isSubmittingSale}
                    className="bg-sale-accent text-sale-accent-foreground hover:bg-sale-accent/90 gap-2"
                  >
                    Realizar venta
                    <kbd className="hidden sm:inline-flex items-center rounded border border-sale-accent-foreground/30 bg-sale-accent-foreground/10 px-1.5 py-0.5 text-[10px] font-medium leading-none">
                      ⇧ Enter
                    </kbd>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Atajo: Shift + Enter</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              onClick={handleCancelInvoice}
              type="button"
              tabIndex={-1}
              variant={'outline'}
              className="hover:bg-secondary hover:text-primary hover:border"
            >
              Cancelar
            </Button>
          </div>
        </section>
      </form>

      <ConfirmSaleModal
        open={confirmSaleOpen}
        sellType={sellType}
        clientName={getValues('client_name') ?? ''}
        total={invoiceCreated.grand_total ?? 0}
        expirationDate={
          sellType === SELL_TYPES.CREDITO && pendingFormValues?.invoice_expiration
            ? format(new Date(pendingFormValues.invoice_expiration), "d 'de' MMMM, yyyy", {
                locale: es
              })
            : undefined
        }
        isSubmitting={isSubmittingSale}
        onCancel={() => {
          if (isSubmittingSale) return;
          setConfirmSaleOpen(false);
          setPendingFormValues(null);
        }}
        onConfirm={handleConfirmedSubmit}
      />

      <AlertDialog
        open={isOpenDialogAfterInvoice}
        onOpenChange={(open) => {
          setIsOpenDialogAfterInvoice(open);

          if (!open) {
            focusElement(clientTriggerRef.current);
          }
        }}
      >
        <AlertDialogContent
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            focusElement(printDialogButtonRef.current);
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">¿Que deseas hacer?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-center text-muted-foreground">
            `Enter` imprime, `D` descarga el PDF y `Esc` cierra esta ventana.
          </p>
          <AlertDialogFooter className="sm:justify-center sm:gap-2">
            {invoiceRecentCreated && (
              <ActionButtons
                invoice={invoiceRecentCreated}
                printButtonRef={printDialogButtonRef}
                downloadButtonRef={downloadDialogButtonRef}
              />
            )}
            <AlertDialogCancel>Nada</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Billing;
