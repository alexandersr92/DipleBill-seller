import axios from 'axios';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import ProductTable from '../components/ProductTable';
import { ConfirmSaleModal } from '../components/ConfirmSaleModal';
import { CheckClientModal } from '../components/CheckClientModal';
import { checkSimilarity, isGenericClientName } from '@/helpers/stringSimilarity';
import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Store, User, ChevronsUpDown, PaintRoller, Sun, Moon, Laptop2, LogOut } from 'lucide-react';
import { fetchCurrentStore } from '@/modules/stores/slices/storeThunks';
import { performLogout } from '@/modules/auth/services/authService';
import { useTheme } from '@/components/theme-provider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@/components/ui/AppDropdownMenu';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';

import { billingSchema } from '../helpers/billingSchema';
import { yupResolver } from '@hookform/resolvers/yup';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { InferType } from 'yup';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { createBilling, replaceInvoice } from '../services/billingThunks';
import { IInvoiceProduct, ISingleInvoice, SELL_TYPES, PAYMENT_METHODS } from '../types';
import { useToast } from '@/components/hooks/use-toast';
import {
  clearInvoice,
  resetProductsInvoice,
  updateInvoice,
  addProductsToBilling,
  cancelEditingInvoice
} from '../slices/billingSlice';
import { sellerLogout } from '@/modules/auth/slices/userSlice';
import { addClientFromInvoice, getClients } from '@/modules/clients/services/clientsThunks';
import { handleKeyDown } from '../helpers';
import { getBillingProductsApi } from '../services/billingApi';
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
  const invoiceNoteRef = useRef<HTMLTextAreaElement | null>(null);
  const productSearchRef = useRef<HTMLInputElement>(null);
  const printDialogButtonRef = useRef<HTMLButtonElement>(null);
  const downloadDialogButtonRef = useRef<HTMLButtonElement>(null);

  const { toast } = useToast();

  const currentUser = useAppSelector((state) => state.userSlice);
  const { store, stores } = useAppSelector((state) => state.storeSlice);
  const { setTheme } = useTheme();

  const handleStoreChange = (newStoreId: string) => {
    localStorage.setItem('currentStoreId', newStoreId);
    dispatch(fetchCurrentStore(newStoreId));

    localStorage.removeItem('seller_id');
    localStorage.removeItem('seller_name');
    localStorage.removeItem('seller_code');
    dispatch(sellerLogout());
  };

  const handleSellerLogout = () => {
    localStorage.removeItem('seller_id');
    localStorage.removeItem('seller_name');
    localStorage.removeItem('seller_code');
    dispatch(sellerLogout());
  };

  const handleFullLogout = () => {
    localStorage.clear();
    dispatch(performLogout());
  };

  const storeId = store?.id || localStorage.getItem('currentStoreId') || '';
  const invoiceCreated = useAppSelector((state) => state.billingSlice.invoice);
  const clients = useAppSelector((state) => state.clientSlice.clients);
  const productsSelected = useAppSelector((state) => state.billingSlice.productsSelected);
  const isEditing = useAppSelector((state) => state.billingSlice.isEditing);
  const editingInvoiceId = useAppSelector((state) => state.billingSlice.editingInvoiceId);
  const editingInvoiceNumber = useAppSelector((state) => state.billingSlice.editingInvoiceNumber);

  const [sellType, setSellType] = useState<string>('contado');
  const [isClientSelected, setIsClientSelected] = useState<boolean>(false);
  const [isOpenDialogAfterInvoice, setIsOpenDialogAfterInvoice] = useState<boolean>(false);
  const [invoiceRecentCreated, setInvoiceRecentCreated] = useState<ISingleInvoice>();
  const [confirmSaleOpen, setConfirmSaleOpen] = useState<boolean>(false);
  const [pendingFormValues, setPendingFormValues] = useState<FormValues | null>(null);
  const [isSubmittingSale, setIsSubmittingSale] = useState<boolean>(false);
  const dispatch = useAppDispatch();

  // Validación de similitud de clientes
  const [checkClientModalOpen, setCheckClientModalOpen] = useState<boolean>(false);
  const [similarClients, setSimilarClients] = useState<Array<{ id: string; name: string }>>([]);
  const [isGenericName, setIsGenericName] = useState<boolean>(false);
  const [pendingClientName, setPendingClientName] = useState<string>('');
  const [resolvePendingClient, setResolvePendingClient] = useState<{
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
  } | null>(null);

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
    if (isEditing) {
      dispatch(cancelEditingInvoice());
    }
    handlePostSaleLogout();
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

  useEffect(() => {
    focusElement(clientTriggerRef.current);
  }, []);

  const { register, handleSubmit, control, setValue, getValues, watch } = useForm<FormValues>({
    resolver: yupResolver(billingSchema)
  });
  const invoiceNoteField = register('invoice_note');

  useEffect(() => {
    if (isEditing && invoiceCreated) {
      setValue('client_id', invoiceCreated.client_id, { shouldValidate: true });
      setValue('client_name', invoiceCreated.client_name, { shouldValidate: true });
      setValue('invoice_note', invoiceCreated.invoice_note, { shouldValidate: true });
      setValue('isCredit', invoiceCreated.isCredit, { shouldValidate: true });
      setValue('payment_method', invoiceCreated.payment_method, { shouldValidate: true });
      setValue('invoice_date', invoiceCreated.invoice_date, { shouldValidate: true });

      if (invoiceCreated.client_id) {
        setIsClientSelected(true);
      } else {
        setIsClientSelected(false);
      }

      if (invoiceCreated.isCredit) {
        setSellType(SELL_TYPES.CREDITO);
      } else {
        setSellType(SELL_TYPES.CONTADO);
      }
    }
  }, [isEditing, editingInvoiceId, setValue]);

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
  };

  const handlePostSaleLogout = () => {
    localStorage.removeItem('seller_id');
    localStorage.removeItem('seller_name');
    localStorage.removeItem('seller_code');
    dispatch(sellerLogout());
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

  const handleConfirmedSubmit = async (
    paymentMethod: string,
    paymentMetadata: any,
    isCreditSale: boolean
  ) => {
    if (isSubmittingSale) return;
    if (!pendingFormValues || !currentUser.sellerId) {
      setConfirmSaleOpen(false);
      return;
    }

    setIsSubmittingSale(true);
    const values = pendingFormValues;
    const dateExp = values.invoice_expiration ? new Date(values.invoice_expiration) : new Date();

    const cashSessionId = localStorage.getItem('active_cash_session_id') || null;

    const finalNote = isEditing
      ? `Factura editada que reemplaza a la factura N° ${editingInvoiceNumber}. ${values.invoice_note || ''}`.trim()
      : values.invoice_note || '';

    const invoice: any = {
      ...invoiceCreated,
      client_id:
        invoiceCreated.client_id === '--' || !invoiceCreated.client_id
          ? null
          : invoiceCreated.client_id,
      invoice_date: format(new Date(), 'yyyy-MM-dd'),
      store_id: storeId!,
      isCredit: isCreditSale,
      payment_method: isCreditSale ? 'CREDIT' : paymentMethod,
      payment_metadata: paymentMetadata,
      payment_date: format(dateExp, 'yyyy-MM-dd'),
      seller_id: currentUser.sellerId,
      cash_session_id: cashSessionId,
      invoice_note: finalNote,
      products: productsSelected.map((product) => ({
        ...product,
        inventory_id: product.inventory_id ?? ''
      }))
    };

    try {
      let orderedInvoice;
      if (isEditing) {
        const response = await dispatch(
          replaceInvoice({ id: editingInvoiceId!, billing: invoice as any })
        ).unwrap();
        orderedInvoice = buildInvoiceDetailsFromSelectedProducts(
          response.invoice,
          productsSelected
        );

        toast({
          title: 'Factura editada y reemplazada exitosamente!',
          variant: 'success'
        });

        dispatch(cancelEditingInvoice());
      } else {
        const response = await dispatch(createBilling(invoice as any)).unwrap();
        orderedInvoice = buildInvoiceDetailsFromSelectedProducts(response.data, productsSelected);

        toast({
          title: 'Venta realizada exitosamente!',
          variant: 'success'
        });
      }

      clearForm();
      setIsOpenDialogAfterInvoice(true);
      setInvoiceRecentCreated(orderedInvoice);
    } catch (error: unknown) {
      if (import.meta.env.DEV) console.error(error);
      if (axios.isAxiosError(error) && error.response?.data) {
        const { quantity_available, product_name, quantity_requested, message } =
          error.response.data;

        if (quantity_available <= 0) {
          toast({
            title: `No hay stock del producto "${product_name}" y se solicitó ${quantity_requested}`,
            variant: 'error'
          });
        } else if (message) {
          toast({
            title: message,
            variant: 'error'
          });
        } else {
          toast({
            title: isEditing
              ? 'Hubo un error al reemplazar la factura!'
              : 'Hubo un error al realizar la venta!',
            variant: 'error'
          });
        }
      } else {
        toast({
          title: isEditing
            ? 'Hubo un error al reemplazar la factura!'
            : 'Hubo un error al realizar la venta!',
          variant: 'error'
        });
      }
    } finally {
      setConfirmSaleOpen(false);
      setPendingFormValues(null);
      setIsSubmittingSale(false);
    }
  };

  const proceedWithCreateClient = async (name: string) => {
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

  const addNewClient: (name: string) => Promise<any> = async (name: string) => {
    if (!name) return;

    // 1. Validar nombre genérico
    const generic = isGenericClientName(name);

    // 2. Buscar clientes similares
    const matches: Array<{ id: string; name: string }> = [];
    if (!generic) {
      clients.forEach((c) => {
        const sim = checkSimilarity(name, c.name);
        if (sim >= 0.8) {
          matches.push({ id: c.id ?? '', name: c.name ?? '' });
        }
      });
    }

    // Interceptar con el modal si es genérico o hay similitudes
    if (generic || matches.length > 0) {
      setPendingClientName(name);
      setIsGenericName(generic);
      setSimilarClients(matches);
      setCheckClientModalOpen(true);

      return new Promise((resolve, reject) => {
        setResolvePendingClient({ resolve, reject });
      });
    }

    return proceedWithCreateClient(name);
  };

  const handleSelectExisting = (client: { id: string; name: string }) => {
    setValue('client_id', client.id, { shouldValidate: true });
    setValue('client_name', client.name, { shouldValidate: true });
    setIsClientSelected(true);

    if (resolvePendingClient) {
      resolvePendingClient.resolve(client);
    }

    setCheckClientModalOpen(false);
    setResolvePendingClient(null);
    focusElement(productSearchRef.current);
  };

  const handleConfirmNew = async () => {
    if (!pendingClientName) return;

    try {
      const res = await proceedWithCreateClient(pendingClientName);
      if (resolvePendingClient) {
        resolvePendingClient.resolve(res);
      }
    } catch (err) {
      if (resolvePendingClient) {
        resolvePendingClient.reject(err);
      }
    } finally {
      setCheckClientModalOpen(false);
      setResolvePendingClient(null);
    }
  };

  const handleCancelCheck = () => {
    if (resolvePendingClient) {
      resolvePendingClient.reject(new Error('Cancelado por el usuario'));
    }
    setCheckClientModalOpen(false);
    setResolvePendingClient(null);
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

  // Atajos de Teclado Globales
  useEffect(() => {
    const handleGlobalShortcuts = (event: KeyboardEvent) => {
      if (confirmSaleOpen || checkClientModalOpen) return;

      switch (event.key) {
        case 'F1':
          event.preventDefault();
          productSearchRef.current?.focus();
          productSearchRef.current?.select();
          break;
        case 'F2':
          event.preventDefault();
          clientTriggerRef.current?.click();
          break;
        case 'F3':
          event.preventDefault();
          if (isClientSelected) {
            const nextType = sellType === 'credito' ? 'contado' : 'credito';
            setSellType(nextType);
            setValue('isCredit', nextType === 'credito', { shouldValidate: true });
            toast({
              title: `Venta cambiada a ${nextType === 'credito' ? 'Crédito' : 'Contado'}`,
              variant: 'success',
              duration: 1500
            });
          } else {
            toast({
              title: 'Debe seleccionar un cliente primero para vender a Crédito',
              variant: 'warning'
            });
          }
          break;
        case 'F4':
          event.preventDefault();
          buttonRef.current?.click();
          break;
        case 'F8':
          event.preventDefault();
          handleCancelInvoice();
          toast({
            title: 'Factura limpiada',
            variant: 'default',
            duration: 1500
          });
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => {
      window.removeEventListener('keydown', handleGlobalShortcuts);
    };
  }, [sellType, isClientSelected, setValue, confirmSaleOpen, checkClientModalOpen]);

  // Lector de Código de Barras Global
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleBarcodeScan = async (e: KeyboardEvent) => {
      const currentTime = Date.now();
      const isScanner = currentTime - lastKeyTime < 35;
      lastKeyTime = currentTime;

      const target = e.target as HTMLElement | null;
      const isInputFocused = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      if (e.key.length === 1) {
        if (isScanner || buffer.length > 0) {
          buffer += e.key;
        } else if (!isInputFocused) {
          buffer = e.key;
        }
      } else if (e.key === 'Enter') {
        if (buffer.length >= 3 && (isScanner || currentTime - lastKeyTime < 50)) {
          e.preventDefault();
          e.stopPropagation();
          const barcode = buffer.trim();
          buffer = '';

          toast({
            title: `Código leído: ${barcode}`,
            variant: 'default',
            duration: 1200
          });

          try {
            const response = await getBillingProductsApi({
              search: barcode,
              storeId: storeId || ''
            });
            const items = Array.isArray(response?.data) ? response.data : [];
            const exactProduct = items.find(
              (p: any) => p.barcode?.toLowerCase() === barcode.toLowerCase()
            );

            if (exactProduct) {
              dispatch(
                addProductsToBilling({
                  ...exactProduct,
                  quantity: 1,
                  total: exactProduct.price,
                  tax: 0,
                  grand_total: exactProduct.price,
                  discount: 0
                })
              );
              toast({
                title: `${exactProduct.name} agregado`,
                variant: 'success',
                duration: 1500
              });
            } else {
              toast({
                title: `Código "${barcode}" no encontrado.`,
                variant: 'error'
              });
            }
          } catch (err) {
            console.error('Error al escanear código de barra:', err);
          }
        } else {
          buffer = '';
        }
      }
    };

    window.addEventListener('keydown', handleBarcodeScan);
    return () => window.removeEventListener('keydown', handleBarcodeScan);
  }, [storeId, dispatch]);

  return (
    <div className="h-[calc(100vh-var(--bottom-nav-height))] flex flex-col overflow-hidden w-full select-none bg-background">
      {/* Barra de Navegación Local para Venta */}
      <header className="flex-shrink-0 flex h-14 w-full items-center justify-between border-b bg-card px-6 shadow-sm z-10">
        {/* Lado Izquierdo: Sucursal */}
        <div className="flex items-center gap-2 max-w-[50%]">
          {stores.length > 1 ? (
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary shrink-0" />
              <Select value={store?.id || ''} onValueChange={handleStoreChange}>
                <SelectTrigger className="h-9 w-[180px] bg-transparent border-input focus:ring-1 focus:ring-ring text-sm font-medium">
                  <SelectValue placeholder="Seleccionar Sucursal" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Store className="h-5 w-5" />
              </div>
              <div className="grid text-left leading-tight">
                <span className="font-semibold text-sm truncate">{store?.name || 'Sucursal'}</span>
                <span className="text-[11px] text-muted-foreground truncate max-w-[200px] md:max-w-xs">
                  {store?.address || 'Punto de Venta'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Lado Central: Titulo */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm font-black uppercase tracking-wider text-theme_blue">
            Facturación POS
          </span>
        </div>

        {/* Lado Derecho: Usuario / Dropdown */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="flex h-10 gap-2 px-2 hover:bg-accent hover:text-accent-foreground select-none rounded-lg">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </div>
                <div className="hidden md:grid text-left text-xs leading-none">
                  <span className="font-medium truncate max-w-[100px]">
                    {currentUser.sellerName || 'Vendedor'}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {currentUser.sellerCode ? `Cód: ${currentUser.sellerCode}` : ''}
                  </span>
                </div>
                <ChevronsUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mt-1" align="end" sideOffset={4}>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none">
                    {currentUser.sellerName || 'Vendedor'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer">
                    <PaintRoller className="mr-2 h-4 w-4" />
                    <span>Tema</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem className="cursor-pointer" onClick={() => setTheme('dark')}>
                        <Moon className="mr-2 h-4 w-4" />
                        <span>Oscuro</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => setTheme('light')}>
                        <Sun className="mr-2 h-4 w-4" />
                        <span>Claro</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        onClick={() => setTheme('system')}>
                        <Laptop2 className="mr-2 h-4 w-4" />
                        <span>Sistema</span>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSellerLogout}
                className="cursor-pointer text-amber-500 focus:text-amber-500">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cambiar Vendedor</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleFullLogout}
                className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión Admin</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Formulario Principal de Facturación */}
      <form
        ref={formRef}
        className="flex-grow flex flex-col gap-4 overflow-hidden p-4 pb-10"
        data-sell-type={sellType}
        data-is-editing={isEditing}
        onKeyDown={(e) => handleKeyDown({ event: e, formRef, buttonRef })}
        onSubmit={handleSubmit(onSubmit)}>
        <ProductTable
          sellType={sellType}
          productSearchRef={productSearchRef}
          headerContent={
            <section className="flex-shrink-0 relative rounded-md shadow-md p-4 border mb-0 before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-sale-accent-strong before:rounded-t-md bg-card">
              <div className="flex justify-between items-start">
                <div className="w-full md:w-3/5 text-sm">
                  <h1 className="text-2xl font-bold">
                    {isEditing ? `Editando Factura #${editingInvoiceNumber}` : 'Nueva factura'}
                  </h1>
                  <p className="mt-1 text-muted-foreground">
                    {isEditing
                      ? 'Modifique los datos y guarde para anular la factura anterior y emitir una nueva.'
                      : 'Complete los detalles básicos de la transacción.'}
                  </p>
                </div>
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-sale-accent text-sale-accent hover:bg-sale-accent-soft"
                    onClick={() => {
                      dispatch(cancelEditingInvoice());
                      clearForm();
                      toast({
                        title: 'Edición cancelada',
                        description: 'Se ha regresado al modo de nueva factura.',
                        variant: 'default'
                      });
                    }}>
                    Cancelar Edición
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-6 mt-6 border-t pt-4">
                <div className="w-full">
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
                        onAfterSelect={() => focusElement(productSearchRef.current)}
                        placeholder="Seleccionar Cliente"
                        searchPlaceholder="Buscar Cliente"
                        field={field}
                        getCallback={handleSearchClients}
                        addRecord={addNewClient}
                      />
                    )}
                  />
                </div>

                <div className="w-full">
                  <Label htmlFor="seller">Vendedor</Label>
                  <Input
                    id="seller"
                    readOnly
                    disabled
                    className="h-10 bg-muted/50 font-medium"
                    value={currentUser.sellerName || currentUser.email || ''}
                  />
                  <Input type="hidden" {...register('seller_id')} value={currentUser.id || ''} />
                </div>

                <div className="w-full flex flex-col">
                  <Label
                    htmlFor="invoice_note"
                    className="text-xs font-semibold text-muted-foreground mb-1.5">
                    Detalles de la factura (Notas)
                  </Label>
                  <Textarea
                    id="invoice_note"
                    tabIndex={4}
                    placeholder="Ej. Entregar en empaque de regalo, observaciones del cliente, etc."
                    className="h-10 min-h-[40px] max-h-[100px] py-2 px-3 text-sm rounded-md border border-input bg-background shadow-sm transition-all duration-200 placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-theme_blue disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    {...invoiceNoteField}
                    ref={(node) => {
                      invoiceNoteField.ref(node);
                      invoiceNoteRef.current = node;
                    }}
                  />
                </div>
              </div>
            </section>
          }>
          <div className="border-t pt-4 w-full flex flex-col gap-2.5 items-center">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    tabIndex={-1}
                    ref={buttonRef}
                    disabled={isSubmittingSale}
                    className="w-full bg-sale-accent text-sale-accent-foreground hover:bg-sale-accent/90 gap-2 h-11 text-base font-black shadow-md border border-slate-350/10 dark:border-slate-800">
                    {isEditing ? 'Guardar' : 'Realizar venta'}
                    <kbd className="hidden sm:inline-flex items-center rounded border border-sale-accent-foreground/30 bg-sale-accent-foreground/10 px-1.5 py-0.5 text-[10px] font-medium leading-none">
                      ⇧ Enter
                    </kbd>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Atajo: Shift + Enter / Cobrar</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Button
              onClick={handleCancelInvoice}
              type="button"
              tabIndex={-1}
              variant={'outline'}
              className="w-full hover:bg-secondary hover:text-primary hover:border h-10 text-sm font-bold border-2">
              Cancelar factura
            </Button>
          </div>
        </ProductTable>
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

      <CheckClientModal
        open={checkClientModalOpen}
        newClientName={pendingClientName}
        similarClients={similarClients}
        isGeneric={isGenericName}
        onCancel={handleCancelCheck}
        onSelectExisting={handleSelectExisting}
        onConfirmNew={handleConfirmNew}
      />

      <AlertDialog
        open={isOpenDialogAfterInvoice}
        onOpenChange={(open) => {
          setIsOpenDialogAfterInvoice(open);

          if (!open) {
            handlePostSaleLogout();
          }
        }}>
        <AlertDialogContent
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            focusElement(printDialogButtonRef.current);
          }}>
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
      {/* Barra de atajos flotante al final */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t py-2 px-4 flex flex-wrap justify-center gap-x-6 gap-y-1.5 text-[11px] text-muted-foreground select-none z-40 shadow-lg">
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[9px] font-extrabold shadow-sm">
            F1
          </kbd>
          <span>Buscar Producto</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[9px] font-extrabold shadow-sm">
            F2
          </kbd>
          <span>Seleccionar Cliente</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[9px] font-extrabold shadow-sm">
            F3
          </kbd>
          <span>Contado / Crédito</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[9px] font-extrabold shadow-sm">
            F4
          </kbd>
          <span>Pagar (Cobrar)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[9px] font-extrabold shadow-sm">
            F8
          </kbd>
          <span>Limpiar Pantalla</span>
        </div>
        <div className="h-4 w-px bg-border hidden md:block" />
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-medium">Lectora Activa</span>
        </div>
      </div>
    </div>
  );
};

export default Billing;
