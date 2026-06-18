import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { getPurchaseById, editPurchase } from '../slices/purchaseThunks';
import { Input } from '../../../components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import EditTable from '../components/EditTable';
import { Button } from '../../../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '../../../components/ui/AppDropdownMenu';
import { Icons } from '../../../components/ui/icons';
import { Pencil } from 'lucide-react';
import { IComprasProduct, IPurchaseItem } from '../types/compras.types';
import { useParams } from 'react-router';
import { clearPurchase } from '../slices/purchaseSlice';

export default function Purchase() {
  const dispatch = useAppDispatch();
  const { id } = useParams<{ id: string }>();
  const purchase = useAppSelector((state) => state.puchaseSlice.purchase);
  const isLoading = useAppSelector((state) => state.puchaseSlice.isLoading);
  const [isEdit, setIsEdit] = useState(false);
  const [products, setProducts] = useState<IComprasProduct[]>([]);

  const { register, handleSubmit, reset } = useForm<IPurchaseItem>();
  useEffect(() => {
    if (id) {
      dispatch(getPurchaseById(id));
    }

    return () => {
      dispatch(clearPurchase());
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (purchase?.products) {
      setProducts(purchase.products);
    }
  }, [purchase]);

  useEffect(() => {
    if (purchase) {
      reset({
        store_name: purchase.store_name || '',
        purchase_date: purchase.purchase_date || '',
        inventory_name: purchase.inventory_name || '',
        supplier_name: purchase.supplier_name || '',
        total_items: purchase.total_items || 0,
        total: purchase.total || 0,
        purchase_note: purchase.purchase_note || ''
      });
    }
  }, [purchase, reset]);

  const handleTableUpdate = (updatedProduct: IComprasProduct) => {
    setProducts((prev) => {
      const existingProductIndex = prev.findIndex(
        (product) => product.product_id === updatedProduct.product_id
      );

      let updatedProducts;
      if (existingProductIndex !== -1) {
        updatedProducts = [...prev];
        updatedProducts[existingProductIndex] = updatedProduct;
      } else {
        updatedProducts = [updatedProduct, ...prev];
      }

      return updatedProducts;
    });
  };

  const onSubmit = (data: IPurchaseItem) => {
    if (!id) return;
    const totalItemsCount = products.reduce((acc, curr) => acc + (curr.quantity ?? 0), 0);
    const totalCost = products.reduce(
      (acc, curr) => acc + (curr.cost ?? 0) * (curr.quantity ?? 0),
      0
    );

    const updateBody = {
      ...data,
      total_items: totalItemsCount,
      total: totalCost,
      products,
      store_id: purchase?.store_id || '',
      inventory_id: purchase?.inventory_id || '',
      supplier_id: purchase?.supplier_id || ''
    };

    dispatch(editPurchase({ id, purchase: updateBody }));
    setIsEdit(false);
  };

  return isLoading || !purchase ? (
    <p>Loading...</p>
  ) : (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 p-4">
      <section className="rounded-md shadow-sm p-4 border mb-4">
        <div className="w-full flex items-center justify-between text-sm pb-2 border-0 border-b">
          <h1 className="text-2xl font-bold">Compra #{purchase?.id}</h1>
          {isEdit ? (
            <Button type="submit" className="bg-primary text-white px-4 py-2 rounded-md">
              Guardar
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <Icons.DotsHorizontalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px] z-50">
                <DropdownMenuItem onClick={() => setIsEdit(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="space-y-1">
            <Label htmlFor="store_name">Tienda</Label>
            <Input id="store_name" value={purchase?.store_name} disabled={true} readOnly={true} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="purchase_date">Fecha de compra</Label>
            <Input id="purchase_date" value={purchase?.purchase_date} disabled={true} readOnly={true} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="inventory_name">Inventario</Label>
            <Input id="inventory_name" value={purchase?.inventory_name} disabled={true} readOnly={true} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="supplier_name">Proveedor</Label>
            <Input id="supplier_name" value={purchase?.supplier_name} disabled={true} readOnly={true} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="total_items">Total de artículos</Label>
            <Input id="total_items" value={purchase?.total_items} disabled={true} readOnly={true} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="total">Total</Label>
            <Input id="total" value={purchase?.total} disabled={true} readOnly={true} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="purchase_note">Nota de compra</Label>
            <Textarea id="purchase_note" {...register('purchase_note')} disabled={!isEdit} readOnly={!isEdit} />
          </div>
        </div>
      </section>

      <section className="flex-1 mt-2 rounded-md shadow-sm p-4 border mb-2">
        <h2 className="text-xl font-bold py-2">Productos</h2>
        <div className="max-h-52 overflow-auto relative">
          <EditTable products={products} isEdit={isEdit} onUpdate={handleTableUpdate} />
        </div>
      </section>
    </form>
  );
}
