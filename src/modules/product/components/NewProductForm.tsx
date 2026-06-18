import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { createProduct, getProduct, updateProduct } from '../slices/productThunks';
import { useToast } from '@/components/hooks/use-toast';
import { yupResolver } from '@hookform/resolvers/yup';
import { productSchema, ProductForm } from '../helpers/schemas';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectGroup
} from '@/components/ui/select';
import {
  CreateProductRequest,
  // ProductSupplier,
  // ProductByIdResponse,
  PartialUpdateProductRequest
} from '../helpers/interfaces';
import { useEffect, useState } from 'react';
import { getCategoriesApi } from '@/modules/category/services/categoryService';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Info } from 'lucide-react';
import { getSuppliers } from '@/modules/supplier/services/supplierThunks';
import { getTagsApi } from '@/modules/tag/services/tagService';
import { Tag } from '@/modules/tag/types/tag.types';
import { getInventories } from '../services/inventoryService';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CaretSortIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import axiosInstance from '@/helpers/axiosInstance';
import axios from 'axios';
import { Badge } from '@/components/ui/badge';
import { deleteProductImage, handleProductImage } from '../services/productService';
import { Icons } from '@/components/ui/icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { measurementUnits, findUnitByValueOrAlias } from '../helpers/units';

interface Category {
  id: string;
  name: string;
}

interface Inventory {
  id: string;
  name: string;
  store: string;
  store_id: string;
  address: string;
  productsQuantity: number;
}

/* Create category */
const createCategory = async (name: string) => {
  try {
    const response = await axiosInstance.post(`/v1/categories?name=${name}`, {
      name
    });
    return response.data;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error al crear la categoría:', error);
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.error('La ruta /categories no fue encontrada. Verifica la configuración de la API.');
      }
    }
    throw error;
  }
};

/* Create tag */
const createTag = async (name: string) => {
  try {
    const response = await axiosInstance.post('/v1/tags', {
      name
    });
    return response.data;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error al crear la etiqueta:', error);
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.error('La ruta /tags no fue encontrada. Verifica la configuración de la API.');
      }
    }
    throw error;
  }
};

/* Render limited badges */
const renderLimitedBadges = (
  items: { id: string; name: string }[],
  selectedIds: string[],
  limit: number
) => {
  const selectedItems = items.filter((item) => selectedIds.includes(item.id));
  const displayItems = selectedItems.slice(0, limit);
  const remainingCount = selectedItems.length - limit;

  return (
    <div className="flex flex-wrap gap-1">
      {displayItems.map((item) => (
        <Badge key={item.id} variant="secondary" className="mr-1">
          {item.name}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="secondary" className="mr-1">
          +{remainingCount} más
        </Badge>
      )}
    </div>
  );
};

interface NewProductFormProps {
  isEditing?: boolean;
  productId?: string;
  inventoryId?: string;
}

export const NewProductForm = ({
  isEditing = false,
  productId,
  inventoryId
}: NewProductFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
    setError,
    reset
  } = useForm<ProductForm>({
    defaultValues: {
      name: '',
      sku: '',
      barcode: '',
      description: '',
      image: undefined,
      price: '',
      min_stock: 0,
      unit_of_measure: '',
      tags: '',
      categories: '',
      suppliers: '',
      inventory: undefined,
      cost: ''
    },
    resolver: yupResolver(productSchema),
    mode: 'onChange',
    context: {
      isEditing
    }
  });

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [imageFile, setImageFile] = useState<File | undefined>(undefined);
  const [isDeleteImageDialogOpen, setIsDeleteImageDialogOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function initializeInventories() {
      try {
        const response = await getInventories();
        if (cancelled) return;
        setInventories(response);

        if (inventoryId) {
          setValue('inventory', inventoryId);
        } else if (!isEditing && response.length > 0) {
          setValue('inventory', response[0].id);
        }
      } catch (error: unknown) {
        if (cancelled) return;
        if (import.meta.env.DEV) console.error('Error al cargar los inventarios:', error);
        toast({
          title: 'Error al cargar inventarios',
          description: 'No se pudo cargar los inventarios',
          variant: 'error'
        });
      }
    }

    initializeInventories();

    return () => {
      cancelled = true;
    };
  }, [setValue, isEditing, inventoryId, toast]);

  useEffect(() => {
    let cancelled = false;

    const suppliersPromise = dispatch(
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

    async function fetchInitialData() {
      try {
        const [categoriesRes, suppliersRes, tagsRes] = await Promise.all([
          getCategoriesApi(),
          suppliersPromise.unwrap(),
          getTagsApi()
        ]);

        if (cancelled) return;

        setCategories(categoriesRes.data);
        setSuppliers(
          suppliersRes.data.map((supplier) => ({
            id: supplier.id,
            name: supplier.name
          }))
        );
        setTags(tagsRes.data);
      } catch (error: unknown) {
        if (cancelled) return;
        if (import.meta.env.DEV) console.error('Error al cargar los datos iniciales:', error);
        toast({
          title: 'Error al cargar datos',
          description: 'Error al cargar datos iniciales',
          variant: 'error'
        });
      }
    }

    fetchInitialData();

    return () => {
      cancelled = true;
      suppliersPromise.abort();
    };
  }, [dispatch, toast]);

  useEffect(() => {
    if (!isEditing || !productId) return;

    let cancelled = false;
    const promise = dispatch(getProduct(productId));

    async function fetchProductData() {
      try {
        const data = await promise.unwrap();
        if (cancelled) return;

        // Acepta tanto arrays como un único objeto/string desde la API
        const extractIds = (value: unknown): string[] => {
          if (value == null) return [];
          const items = Array.isArray(value) ? value : [value];
          return items
            .map((item) =>
              typeof item === 'string' ? item : (item as { id?: string } | null)?.id
            )
            .filter((id): id is string => Boolean(id));
        };

        const categoryIds = extractIds(data.categories);
        const tagIds = extractIds(data.tags);
        const supplierId = extractIds(data.suppliers)[0] ?? '';
        // Si la API regresa un alias (p.ej. "unidad"), normalizamos al valor canónico ("unit")
        const normalizedUnit =
          findUnitByValueOrAlias(data.unit_of_measure ?? '')?.value ?? data.unit_of_measure ?? '';
        const inventoryEntries = Array.isArray((data as { inventory?: unknown[] }).inventory)
          ? (data as unknown as { inventory: Array<{ inventory_id?: string; id?: string }> }).inventory
          : Array.isArray((data as { inventories?: unknown[] }).inventories)
            ? (data as unknown as { inventories: Array<{ inventory_id?: string; id?: string }> }).inventories
            : [];
        const selectedInventoryId =
          inventoryEntries.find((inventory) => inventory?.inventory_id || inventory?.id)
            ?.inventory_id ||
          inventoryEntries.find((inventory) => inventory?.inventory_id || inventory?.id)?.id ||
          inventoryId ||
          '';

        setSelectedCategories(categoryIds);
        setSelectedTags(tagIds);
        setPreviewImage(typeof data.image === 'string' ? data.image : null);
        reset({
          name: data.name ?? '',
          sku: data.sku ?? '',
          barcode: data.barcode ?? '',
          description: data.description ?? '',
          image: undefined,
          price: data.price != null ? String(data.price) : '',
          min_stock: Number(data.min_stock ?? 0),
          unit_of_measure: normalizedUnit,
          tags: tagIds.join(','),
          categories: categoryIds.join(','),
          suppliers: supplierId,
          inventory: selectedInventoryId,
          cost: (data as { cost?: string | number }).cost != null
            ? String((data as { cost?: string | number }).cost)
            : ''
        });
      } catch (error: unknown) {
        if (cancelled) return;
        if (error instanceof Error && error.name === 'AbortError') return;
        if (
          typeof error === 'object' &&
          error !== null &&
          'name' in error &&
          error.name === 'AbortError'
        ) {
          return;
        }

        if (import.meta.env.DEV) console.error('Error al cargar los datos del producto:', error);
        toast({
          title: 'Error al cargar producto',
          description: 'No se pudo cargar los datos del producto',
          variant: 'error'
        });
      }
    }

    fetchProductData();

    return () => {
      cancelled = true;
      promise.abort();
    };
  }, [dispatch, inventoryId, isEditing, productId, reset]);

  const watchedSupplierId = watch('suppliers');

  useEffect(() => {
    const selectedSupplier = suppliers.find((s) => s.id === watchedSupplierId);
    if (selectedSupplier) {
      setValue('suppliers', selectedSupplier.id);
    }
  }, [suppliers, setValue, watchedSupplierId]);

  /* Handle image change */
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
      setImageFile(file);
      setValue('image', file);
    }
  };

  /* Handle delete image */
  const handleDeleteImage = async () => {
    try {
      if (isEditing && productId) {
        await deleteProductImage(productId);
        toast({
          title: 'Éxito',
          description: 'La imagen se ha eliminado correctamente',
          variant: 'success'
        });
      }
      setPreviewImage(null);
      setImageFile(undefined);
      setValue('image', undefined);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error al eliminar la imagen:', error);
      toast({
        title: 'Error al eliminar imagen',
        description: 'No se pudo eliminar la imagen',
        variant: 'error'
      });
    }
  };

  const onSubmit = async (data: ProductForm) => {
    try {
      if (isEditing && productId) {
        if (imageFile) {
          await handleProductImage(imageFile, productId);
        }

        const updateData: PartialUpdateProductRequest = {
          name: data.name,
          description: data.description ?? undefined,
          price: data.price,
          min_stock: Number(data.min_stock),
          unit_of_measure: data.unit_of_measure,
          suppliers: data.suppliers,
          categories: data.categories ?? undefined,
          tags: data.tags ?? undefined
        };

        await dispatch(updateProduct({ id: productId, data: updateData })).unwrap();
        toast({
          title: 'Producto actualizado exitosamente!',
          variant: 'success'
        });
        navigate(inventoryId ? '/inventories' : '/products');
      } else {
        // Estos campos están marcados como requeridos por el esquema cuando isEditing=false,
        // pero el tipo inferido los marca como opcionales por el ramal de edición.
        const createData: CreateProductRequest = {
          ...data,
          barcode: data.barcode ?? '',
          categories: data.categories ?? '',
          description: data.description ?? '',
          tags: data.tags ?? '',
          image: imageFile,
          price: data.price.toString(),
          inventories: inventoryId || data.inventory
        };

        const result = await dispatch(createProduct(createData)).unwrap();
        if (result) {
          toast({
            title: 'Producto creado exitosamente!',
            variant: 'success'
          });
          navigate(inventoryId ? '/inventories' : '/products');
        }
      }
    } catch (error: unknown) {
      if (import.meta.env.DEV) console.error('Error al guardar el producto:', error);

      const rejected = error as { errors?: Record<string, string[]>; message?: string };
      if (rejected.errors) {
        Object.entries(rejected.errors).forEach(([field, messages]) => {
          const message = Array.isArray(messages) ? messages[0] : messages;
          setError(field as keyof ProductForm, {
            type: 'manual',
            message: message as string
          });
        });

        toast({
          title: 'Error al guardar el producto',
          description: rejected.message || 'Verifique los campos marcados en rojo',
          variant: 'error'
        });
      } else {
        toast({
          title: 'Error al guardar producto',
          description: rejected.message || 'Error desconocido al guardar el producto',
          variant: 'error'
        });
      }
    }
  };

  const renderCreateFields = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        {/* Name */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input id="name" {...register('name')} className="h-10" />
          <div className="form-error-slot">
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>
        </div>

        {/* Category */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="category">Categorías</Label>
          <Controller
            name="categories"
            control={control}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      'w-full justify-between min-h-[2.5rem] h-auto py-2',
                      !field.value && 'text-muted-foreground'
                    )}>
                    <span>
                      {selectedCategories.length > 0
                        ? renderLimitedBadges(categories, selectedCategories, 3)
                        : 'Seleccionar categorías'}
                    </span>
                    <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                  align="start"
                  sideOffset={5}>
                  <Command>
                    <div className="relative">
                      <CommandInput
                        placeholder="Buscar o crear categoría..."
                        className="h-9 pr-8"
                        value={categorySearchTerm}
                        onValueChange={setCategorySearchTerm}
                      />
                      <div className="absolute inset-y-0 right-2 flex items-center">
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              Escribe el nombre de la categoría. Si no existe, se creará con lo que
                              escribas al presionar “+ Crear”.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    <CommandList>
                      <CommandEmpty>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={async () => {
                            if (categorySearchTerm) {
                              try {
                                const newCategory = await createCategory(categorySearchTerm);
                                setCategories([...categories, newCategory]);
                                const newSelectedCategories = [
                                  ...selectedCategories,
                                  newCategory.id
                                ];
                                setSelectedCategories(newSelectedCategories);
                                field.onChange(newSelectedCategories.join(','));
                                setCategorySearchTerm('');
                                toast({
                                  title: 'Categoría creada',
                                  description: `Se ha creado la categoría "${categorySearchTerm}"`,
                                  variant: 'success'
                                });
                              } catch (error) {
                                toast({
                                  title: 'Error al crear la categoría',
                                  description: `No se pudo crear la nueva categoría. Error: ${error}`,
                                  variant: 'error'
                                });
                              }
                            }
                          }}>
                          + Crear &quot;{categorySearchTerm}&quot;
                        </Button>
                      </CommandEmpty>
                      <CommandGroup>
                        {categories.map((category) => (
                          <CommandItem
                            key={category.id}
                            onSelect={() => {
                              const newSelectedCategories = selectedCategories.includes(category.id)
                                ? selectedCategories.filter((id) => id !== category.id)
                                : [...selectedCategories, category.id];
                              setSelectedCategories(newSelectedCategories);
                              field.onChange(newSelectedCategories.join(','));
                            }}>
                            <div className="flex items-center">
                              <Checkbox
                                checked={selectedCategories.includes(category.id)}
                                className="mr-2"
                              />
                              {category.name}
                            </div>
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
            {errors.categories && (
              <p className="form-error">{errors.categories.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Cost */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="cost">Costo *</Label>
          <Input id="cost" type="text" {...register('cost')} className="h-10" />
          <div className="form-error-slot">
            {errors.cost && <p className="form-error">{errors.cost.message}</p>}
          </div>
        </div>

        {/* Price */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="price">Precio *</Label>
          <Input id="price" type="text" {...register('price')} className="h-10" />
          <div className="form-error-slot">
            {errors.price && <p className="form-error">{errors.price.message}</p>}
          </div>
        </div>

        {/* Unit of measure */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="unit_of_measure">Unidad de medida *</Label>
          <Controller
            name="unit_of_measure"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className={cn('h-10', errors.unit_of_measure && 'border-red-500/50')}>
                  <SelectValue placeholder="Seleccionar unidad" />
                </SelectTrigger>
                <SelectContent>
                  {measurementUnits.map((category) => (
                    <SelectGroup key={category.label}>
                      <SelectLabel>{category.label}</SelectLabel>
                      {category.units.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value} className="pl-4">
                          {unit.label} ({unit.symbol})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <div className="form-error-slot">
            {errors.unit_of_measure && (
              <p className="form-error">{errors.unit_of_measure.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className={`grid ${inventoryId ? 'grid-cols-3' : 'grid-cols-4'} gap-4`}>
        {/* Min stock */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="min_stock">Mínimo de stock *</Label>
          <Input id="min_stock" type="number" min="0" {...register('min_stock')} className="h-10" />
          <div className="form-error-slot">
            {errors.min_stock && (
              <p className="form-error">{errors.min_stock.message}</p>
            )}
          </div>
        </div>

        {/* Inventory */}
        {!inventoryId && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="inventory">Inventario{!isEditing && ' *'}</Label>
            <Controller
              name="inventory"
              control={control}
              render={({ field }) => {
                const inventoryValue = field.value || inventoryId;

                return (
                  <Select
                    onValueChange={field.onChange}
                    value={inventoryValue}
                    disabled={isEditing}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Seleccionar inventario" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventories.map((inventory) => (
                        <SelectItem key={inventory.id} value={inventory.id}>
                          {inventory.store}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              }}
            />
            <div className="form-error-slot">
              {!isEditing && errors.inventory && (
                <p className="form-error">{errors.inventory.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Supplier */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="supplier">Proveedor *</Label>
          <Controller
            name="suppliers"
            control={control}
            render={({ field }) => {
              return (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            }}
          />
          <div className="form-error-slot">
            {errors.suppliers && (
              <p className="form-error">{errors.suppliers.message}</p>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="tags">Etiquetas</Label>
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      'w-full justify-between min-h-[2.5rem] h-auto py-2',
                      !field.value && 'text-muted-foreground'
                    )}>
                    <span>
                      {selectedTags.length > 0
                        ? renderLimitedBadges(tags, selectedTags, 1)
                        : 'Seleccionar etiquetas'}
                    </span>
                    <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                  align="start"
                  sideOffset={5}>
                  <Command>
                    <div className="relative">
                      <CommandInput
                        placeholder="Buscar o crear etiqueta..."
                        className="h-9 pr-8"
                        value={tagSearchTerm}
                        onValueChange={setTagSearchTerm}
                      />
                      <div className="absolute inset-y-0 right-2 flex items-center">
                        <TooltipProvider delayDuration={0}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              Escribe el nombre de la etiqueta. Si no existe, se creará con lo que
                              escribas al presionar “+ Crear”.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    <CommandList>
                      <CommandEmpty>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={async () => {
                            if (tagSearchTerm) {
                              try {
                                const newTag = await createTag(tagSearchTerm);
                                setTags([...tags, newTag]);
                                const newSelectedTags = [...selectedTags, newTag.id];
                                setSelectedTags(newSelectedTags);
                                field.onChange(newSelectedTags.join(','));
                                setTagSearchTerm('');
                                toast({
                                  title: 'Etiqueta creada',
                                  description: `Se ha creado la etiqueta "${tagSearchTerm}"`,
                                  variant: 'success'
                                });
                              } catch (error) {
                                toast({
                                  title: 'Error al crear la etiqueta',
                                  description: `No se pudo crear la nueva etiqueta. Error: ${error}`,
                                  variant: 'error'
                                });
                              }
                            }
                          }}>
                          + Crear &quot;{tagSearchTerm}&quot;
                        </Button>
                      </CommandEmpty>
                      <CommandGroup>
                        {tags.map((tag) => (
                          <CommandItem
                            key={tag.id}
                            onSelect={() => {
                              const newSelectedTags = selectedTags.includes(tag.id)
                                ? selectedTags.filter((id) => id !== tag.id)
                                : [...selectedTags, tag.id];
                              setSelectedTags(newSelectedTags);
                              field.onChange(newSelectedTags.join(','));
                            }}>
                            <div className="flex items-center">
                              <Checkbox checked={selectedTags.includes(tag.id)} className="mr-2" />
                              {tag.name}
                            </div>
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
            {errors.tags && <p className="form-error">{errors.tags.message}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Codebar */}
        <div className="flex flex-col gap-2">
          <Label>Código de barras</Label>
          <Input id="barcode" type="text" {...register('barcode')} className="h-10" />
          <div className="form-error-slot">
            {errors.barcode && <p className="form-error">{errors.barcode.message}</p>}
          </div>
        </div>
        {/* SKU */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="sku">SKU *</Label>
          <Input id="sku" {...register('sku')} className="h-10" />
          <div className="form-error-slot">
            {errors.sku && <p className="form-error">{errors.sku.message}</p>}
          </div>
        </div>
      </div>

      {/* Image */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="image">Imagen o archivo del producto</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-gray-400 transition-colors relative">
            <input
              id="image"
              type="file"
              {...register('image')}
              className="hidden"
              onChange={handleImageChange}
              accept="image/*"
            />
            <label htmlFor="image" className="cursor-pointer">
              {previewImage ? (
                <div className="relative">
                  <img src={previewImage} alt="Vista previa" className="max-h-40 mx-auto" />
                  <div className="relative">
                    <Button
                      type="button"
                      variant="ghost"
                      className="absolute bottom-0 left-0 h-8 w-8 p-0 bg-white/80 hover:bg-white/90 rounded-full"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsDeleteImageDialogOpen(true);
                      }}>
                      <Icons.trash className="h-4 w-4" />
                    </Button>

                    <AlertDialog
                      open={isDeleteImageDialogOpen}
                      onOpenChange={setIsDeleteImageDialogOpen}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar imagen?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción eliminará la imagen del producto. Esta acción no se puede
                            deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              await handleDeleteImage();
                              setIsDeleteImageDialogOpen(false);
                            }}>
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Camera className="h-12 w-12 text-gray-400" />
                  <span className="mt-2 text-sm text-gray-500">Agregar imagen del producto</span>
                </div>
              )}
            </label>
          </div>
          <div className="form-error-slot">
            {errors.image && <p className="form-error">{errors.image.message}</p>}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Descripción del producto</Label>
          <Textarea id="description" {...register('description')} className="h-full resize-none" />
          <div className="form-error-slot">
            {errors.description && (
              <p className="form-error">{errors.description.message}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Editar artículo' : 'Nuevo artículo'}</CardTitle>
        <CardDescription>Añade un nuevo producto al inventario.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {renderCreateFields()}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => navigate('/products')}>
              Cancelar
            </Button>
            <Button type="submit">{isEditing ? 'Actualizar' : 'Guardar'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
