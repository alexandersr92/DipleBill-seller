import { DatePicker } from '@/components/ui/date-picker';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Button } from '@/components/ui/button';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { InferType } from 'yup';
import { useToast } from '@/components/hooks/use-toast';
import { handleKeyDown } from '../../billing/helpers';
import { getSuppliers } from '../../supplier/services/supplierThunks';
import { compraSchema } from '../helpers/compraSchema';
import { getInventories } from '../../inventory/services/inventoryThunks';
import SearchSelect from '../../../components/ui/SearchSelect';
import { Label } from '../../../components/ui/label';
import { Input } from '../../../components/ui/input';
import { cn } from '../../../lib/utils';
import { File, Plus, X } from 'lucide-react';
import { createCompra, uploadFile } from '../services/comprasApi';
import { createSupplier } from '../../supplier/services/supplierThunks';
import { SupplierForm } from '../../supplier/components/forms/supplier';
import InventoryForm from '../../inventory/components/InventoryForm';
import AppDialog from '@/components/ui/AppDialog';
import { IComprasProduct, IInvalidProduct } from '../types/compras.types';
// dialogs will be handled on confirm only
import { format } from 'date-fns';
import CompraSkeleton from '../components/CompraSkeleton';
import PurchaseSearchInput from '../components/PurchaseSearchInput';
import EditTable from '../components/EditTable';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

type FormValues = InferType<typeof compraSchema>;

const Compra = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { toast } = useToast();

  const storeId = useAppSelector((state) => state.storeSlice.store?.id) ?? '';
  const providers = useAppSelector((state) => state.supplierSlice.suppliers);
  const inventories = useAppSelector((state) => state.inventorySlice.inventories) ?? [];

  const [fileName, setFileName] = useState<string | null>(null);
  const [validProducts, setValidProducts] = useState<IComprasProduct[]>([]);
  const [invalidProducts, setInvalidProducts] = useState<IInvalidProduct[]>([]);
  const [fileKey, setFileKey] = useState(Date.now());
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingPurchaseBody, setPendingPurchaseBody] = useState<any>(null);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const [pendingSupplierName, setPendingSupplierName] = useState('');
  const [pendingInventoryName, setPendingInventoryName] = useState('');

  const dispatch = useAppDispatch();

  const isLoadingSuppliers = useAppSelector((state) => state.supplierSlice.isLoading);
  const isLoadingInventories = useAppSelector((state) => state.inventorySlice.isLoading);

  useEffect(() => {
    dispatch(
      getSuppliers({
        getAll: true,
        per_page: 1000,
        sort: 'name',
        order: 'asc',
        search: '',
        search_by: 'name',
        page: 1
      })
    );
    dispatch(getInventories({ store: storeId }));
  }, [dispatch]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      purchase_date: format(new Date(), 'yyyy-MM-dd')
    }
  });
  const formvalues = watch();
  const clearForm = () => {
    setValue('purchase_date', format(new Date(), 'yyyy-MM-dd'), { shouldValidate: true });
    setValue('purchase_note', '', { shouldValidate: true });
    setValue('storeId', '--', { shouldValidate: true });
    setValue('inventory_id', '--', { shouldValidate: true });
    setValue('supplier_id', 'EVENTUAL', { shouldValidate: true });
  };

  const addNewSupplier = async (name: string) => {
    setPendingSupplierName(name);
    setIsSupplierDialogOpen(true);
  };

  const handleSupplierFormSubmit = async (data: any) => {
    try {
      const result = await dispatch(createSupplier(data)).unwrap();
      if (result?.id) {
        setValue('supplier_id', result.id);
        toast({ title: 'Proveedor creado exitosamente', variant: 'success' });
        dispatch(
          getSuppliers({
            getAll: true,
            per_page: 1000,
            sort: 'name',
            order: 'asc',
            search: '',
            search_by: 'name',
            page: 1
          })
        );
      }
    } catch {
      toast({ title: 'Error al crear proveedor', variant: 'error' });
    } finally {
      setIsSupplierDialogOpen(false);
      setPendingSupplierName('');
    }
  };

  const addNewInventory = async (name: string) => {
    setPendingInventoryName(name);
    setIsInventoryDialogOpen(true);
  };

  const handleInventoryDialogClose = (createdId?: string) => {
    setIsInventoryDialogOpen(false);
    setPendingInventoryName('');
    dispatch(getInventories({ store: storeId }));
    if (createdId) {
      setValue('inventory_id', createdId);
    }
  };

  const clearFile = () => {
    setValue('excelFile', null);
    setFileName(null);
    setFileKey(Date.now());
    setValidProducts([]);
    setInvalidProducts([]);
  };

  const handleAddProductFromSearch = (product: IComprasProduct) => {
    setValidProducts((prev) => {
      const existingIndex = prev.findIndex(
        (p) =>
          (p.product_id !== undefined &&
            product.product_id !== undefined &&
            p.product_id === product.product_id) ||
          (!!p.sku && !!product.sku && p.sku === product.sku)
      );
      if (existingIndex !== -1) {
        const updated = [...prev];
        const current = updated[existingIndex];
        updated[existingIndex] = {
          ...current,
          quantity: (current.quantity ?? 0) + 1,
          // keep latest price/cost from search result if provided
          price: product.price ?? current.price,
          cost: product.cost ?? current.cost
        };
        return updated;
      }
      return [...prev, { ...product, quantity: product.quantity ?? 1 }];
    });
  };

  const handleUpdateEditedProduct = (updated: IComprasProduct) => {
    setValidProducts((prev) =>
      prev.map((p) => {
        const matchById =
          p.product_id !== undefined &&
          updated.product_id !== undefined &&
          p.product_id === updated.product_id;
        const matchBySku = !!p.sku && !!updated.sku && p.sku === updated.sku;
        return matchById || matchBySku ? { ...p, ...updated } : p;
      })
    );
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) {
      if (import.meta.env.DEV) console.error('No file selected');
      return false;
    }
    try {
      const res = await uploadFile(files[0]);

      if (!res.invalid.length) {
        const validProds = [...res.valid_existing, ...res.valid_new];
        setValidProducts(validProds);
        return true;
      } else {
        setInvalidProducts(res.invalid);
        toast({
          title: 'Hubo un error al subir el archivo, por favor intente nuevamente.',
          variant: 'error'
        });
        return false;
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      toast({
        title: 'Error al subir archivo',
        description: 'No se pudo procesar el archivo. Intente nuevamente.',
        variant: 'error'
      });
      return false;
    }
  };

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    if (!values.supplier_id || values.supplier_id === '--') {
      toast({
        title: 'Proveedor requerido',
        description: 'Debes seleccionar un proveedor para realizar la compra.',
        variant: 'error'
      });
      return;
    }

    if (!values.inventory_id || values.inventory_id === '--') {
      toast({
        title: 'Inventario requerido',
        description: 'Debes seleccionar un inventario para realizar la compra.',
        variant: 'error'
      });
      return;
    }

    if (!validProducts.length) {
      toast({
        title: 'Debes seleccionar almenos un producto para realizar la compra!',
        variant: 'error'
      });
      return;
    }

    const sanitizedValues = { ...values } as any;
    if (sanitizedValues.supplier_id === '--') {
      delete sanitizedValues.supplier_id;
    }
    delete sanitizedValues.excelFile;

    // Normalize purchase_date to MySQL-friendly format
    const normalizedPurchaseDate = sanitizedValues.purchase_date
      ? format(new Date(sanitizedValues.purchase_date), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd');

    const totalItemsCount = validProducts.reduce((acc, curr) => acc + (curr.quantity ?? 0), 0);
    const totalCost = validProducts.reduce(
      (acc, curr) => acc + (curr.cost ?? 0) * (curr.quantity ?? 0),
      0
    );

    const purchaseBody = {
      ...sanitizedValues,
      purchase_date: normalizedPurchaseDate,
      products: validProducts,
      store_id: storeId,
      total: totalCost,
      total_items: totalItemsCount
    };

    setPendingPurchaseBody(purchaseBody);
    setIsConfirmOpen(true);
  };

  const handleConfirmPurchase = async () => {
    if (!pendingPurchaseBody) return;
    if (invalidProducts.length > 0) {
      toast({
        title: 'Hay productos inválidos en el archivo. Corrige antes de confirmar.',
        variant: 'error'
      });
      return;
    }

    try {
      const res = await createCompra(pendingPurchaseBody);
      if (res) {
        toast({ title: 'Compra registrada exitosamente!', variant: 'success' });
        clearForm();
        clearFile();
        setIsConfirmOpen(false);
        setPendingPurchaseBody(null);
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      toast({
        title: 'Hubo un error al registrar la compra, por favor intente nuevamente.',
        variant: 'error'
      });
    }
  };

  return isLoadingSuppliers && isLoadingInventories ? (
    <CompraSkeleton />
  ) : (
    <>
      <form
        ref={formRef}
        onKeyDown={(e) => handleKeyDown({ event: e, formRef, buttonRef })}
        onSubmit={handleSubmit(onSubmit)}>
        <section className="rounded-md shadow-md p-4 border mb-4">
          <div className="w-2/5 text-sm">
            <h1 className="text-2xl font-bold">Nueva Compra</h1>
            <p className="mt-2">
              Por favor, complete el formulario a continuación con los detalles necesarios para
              generar su nueva compra.
            </p>
            <p>Asegúrese de incluir toda la información requerida.</p>
          </div>
          {/* No modals on change; confirmation shown only at submit */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="w-full flex flex-wrap">
              <Label htmlFor="supplier_id">Proveedor</Label>
              <Controller
                control={control}
                name="supplier_id"
                defaultValue={'--'}
                render={({ field }) => (
                  <SearchSelect
                    items={providers.length > 0 ? providers : []}
                    selectedItem={
                      providers.find((provider) => provider.id === getValues('supplier_id'))
                        ?.name || '--'
                    }
                    onSelect={(provider) => {
                      setValue('supplier_id', provider.id);
                    }}
                    placeholder="Seleccionar Proveedor"
                    searchPlaceholder="Buscar Proveedor"
                    field={field}
                    addRecord={addNewSupplier}
                  />
                )}
              />
            </div>
            <div className="w-full flex flex-wrap">
              <Label htmlFor="inventory_id">Inventario *</Label>
              <Controller
                control={control}
                name="inventory_id"
                defaultValue={'--'}
                render={({ field }) => (
                  <SearchSelect
                    items={inventories.length > 0 ? inventories : []}
                    selectedItem={
                      inventories.find((inventory) => inventory.id === getValues('inventory_id'))
                        ?.name || '--'
                    }
                    onSelect={(inventory) => {
                      setValue('inventory_id', inventory.id);
                    }}
                    placeholder="Seleccionar Inventario"
                    searchPlaceholder="Buscar Inventario"
                    field={field}
                    addRecord={addNewInventory}
                  />
                )}
              />
            </div>
            <div className="w-full flex gap-2">
              <div className="w-1/2 xl:col-span-1 sm:col-span-2 flex gap-2 flex-wrap items-start flex-col">
                <Label htmlFor="purchase_date">Fecha de compra *</Label>
                <Controller
                  name="purchase_date"
                  control={control}
                  render={({ field }) => {
                    return (
                      <DatePicker
                        tabIndex={1}
                        value={new Date(field.value ?? new Date().toString())}
                        onChange={field.onChange}
                        className="w-full h-10 bg-transparent focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue"
                      />
                    );
                  }}
                />
              </div>

              <div className="w-1/2 xl:col-span-1 sm:col-span-2 flex gap-2 flex-wrap items-start flex-col">
                <Label htmlFor="purchase_note">Nota de compra</Label>
                <Textarea
                  tabIndex={4}
                  className="h-10 focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue"
                  {...register('purchase_note')}
                />
              </div>
            </div>

            <Controller
              name="excelFile"
              control={control}
              render={({ field }) => (
                <div className="w-full">
                  <Label htmlFor="excelFile">Subir archivo (Excel, CSV)</Label>

                  <div
                    className={cn(
                      'relative flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer transition-all',
                      'hover:border-gray-400 hover:bg-secondary'
                    )}>
                    <Input
                      key={fileKey}
                      id="excelFile"
                      type="file"
                      accept=".xls,.xlsx,.csv"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={async (e) => {
                        const files = e.target.files;
                        if (files?.length) {
                          const isFileValid = await handleFileUpload(files);
                          if (!isFileValid) {
                            return;
                          }
                          setFileName(files[0].name);
                        } else {
                          setFileName(null);
                        }
                        field.onChange(files);
                      }}
                      ref={field.ref}
                    />
                    {fileName && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          clearFile();
                        }}
                        aria-label="Quitar archivo"
                        className="absolute top-2 right-2 z-20 bg-gray-200 hover:bg-gray-300 rounded-full p-1 pointer-events-auto">
                        <X className="h-4 w-4 text-gray-600" />
                      </button>
                    )}
                    {fileName ? (
                      <File className="h-6 w-6 text-gray-400 mb-2" />
                    ) : (
                      <Plus className="h-8 w-8 text-gray-400 mb-2" />
                    )}
                    <p className="text-sm text-gray-600">
                      {fileName
                        ? fileName
                        : 'Arrastra y suelta tu archivo aquí o haz clic para seleccionar'}
                    </p>
                  </div>

                  <div className="form-error-slot">
                    {errors.excelFile && (
                      <p className="form-error">{errors.excelFile.message}</p>
                    )}
                  </div>
                </div>
              )}
            />
          </div>
        </section>

        <section className="rounded-md shadow-md p-4 border">
          <div className="flex justify-between items-center mb-4">
            <div className="w-1/2">
              <PurchaseSearchInput
                tabIndex={7}
                placeholder="Buscar productos del inventario por SKU"
                inventoryId={
                  formvalues.inventory_id && formvalues.inventory_id !== '--'
                    ? formvalues.inventory_id
                    : undefined
                }
                onAdd={handleAddProductFromSearch}
              />
            </div>
          </div>

          {validProducts.length > 0 && (
            <EditTable
              products={validProducts}
              onUpdate={handleUpdateEditedProduct}
              isEdit={true}
            />
          )}

          {validProducts.length > 0 && (
            <div className="flex justify-end mt-4 text-sm">
              <div className="w-full max-w-sm space-y-1">
                <div className="flex justify-between">
                  <span>Productos Totales</span>
                  <span>{validProducts.reduce((acc, p) => acc + (p.quantity ?? 0), 0)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total costo</span>
                  <span>
                    {validProducts
                      .reduce((acc, p) => acc + (p.cost ?? 0) * (p.quantity ?? 0), 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-4 w-full flex justify-end gap-3 items-center">
            <Button
              type="submit"
              disabled={
                !validProducts.length ||
                !formvalues.inventory_id ||
                formvalues.inventory_id === '--' ||
                !formvalues.supplier_id ||
                formvalues.supplier_id === '--'
              }
              tabIndex={-1}
              ref={buttonRef}
              className="bg-secondary text-foreground hover:bg-primary hover:text-black hover:border">
              Realizar Compra
            </Button>
            <Button type="button" tabIndex={-1} variant={'outline'} className="hover:bg-[#f4f4f5]">
              Cancelar
            </Button>
          </div>
        </section>
      </form>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">Confirmar compra</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Productos:</span>
              <span>{validProducts.reduce((acc, p) => acc + (p.quantity ?? 0), 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total costo:</span>
              <span>
                {validProducts
                  .reduce((acc, p) => acc + (p.cost ?? 0) * (p.quantity ?? 0), 0)
                  .toFixed(2)}
              </span>
            </div>
            {invalidProducts.length > 0 && (
              <p className="text-red-500">
                Existen productos inválidos del archivo. Corrige antes.
              </p>
            )}
          </div>
          <AlertDialogFooter className="sm:justify-center sm:gap-2">
            <Button
              type="button"
              disabled={invalidProducts.length > 0}
              onClick={handleConfirmPurchase}
              className="bg-secondary text-primary hover:bg-primary hover:text-black hover:border">
              Confirma Compra
            </Button>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AppDialog
        open={isSupplierDialogOpen}
        onOpenChange={() => {
          setIsSupplierDialogOpen(!isSupplierDialogOpen);
          setPendingSupplierName('');
        }}
        title="Agregar Proveedor"
        description="Completa los datos del nuevo proveedor">
        <SupplierForm
          onSubmit={handleSupplierFormSubmit}
          initialValues={{
            name: pendingSupplierName,
            email: '',
            phone: '',
            address: '',
            city: '',
            state: '',
            country: '',
            notes: ''
          }}
        />
      </AppDialog>

      <AppDialog
        open={isInventoryDialogOpen}
        onOpenChange={() => {
          setIsInventoryDialogOpen(!isInventoryDialogOpen);
          setPendingInventoryName('');
        }}
        title="Agregar Inventario"
        description="Completa los datos del nuevo inventario">
        <InventoryForm
          onSubmitSuccess={handleInventoryDialogClose}
          defaultName={pendingInventoryName}
        />
      </AppDialog>
    </>
  );
};

export default Compra;
