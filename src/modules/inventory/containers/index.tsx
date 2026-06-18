import { useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { getInventories } from '../services/inventoryThunks';

import InventoryCardSkeleton from '../components/InventoryCardSkeleton';
import InventoryCard from '../components/InventoryCard';
import AppDialog from '@/components/ui/AppDialog';
import InventoryForm from '../components/InventoryForm';

const Inventories = () => {
  const dispatch = useAppDispatch();
  const storeId = useAppSelector((state) => state.storeSlice.store?.id);
  const { inventories, isLoading } = useAppSelector((state) => state.inventorySlice);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const cardSkeletonAmount = Array(3).fill({});

  useEffect(() => {
    if (storeId) {
      dispatch(getInventories({ store: storeId }));
    }
  }, [storeId, dispatch]);

  return (
    <div className="grid gap-4 grid-cols-3 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 max-w-[86rem] mx-auto">
      {isLoading
        ? cardSkeletonAmount.map((_, i) => <InventoryCardSkeleton key={i} />)
        : inventories
            .slice()
            .sort((a, b) => (a.productsQuantity === 0 ? 1 : b.productsQuantity === 0 ? -1 : 0)) // mostrar los inventarios con productos al principio
            .map((inventory) => <InventoryCard key={inventory.id} inventory={inventory} />)}

      <div
        onClick={() => setIsDialogOpen(!isDialogOpen)}
        className="min-w-48 lg:min-w-96 rounded-lg select-none flex group justify-center min-h-52 items-center cursor-pointer border-dashed border-2 border-gray-500 hover:border-black transition duration-300 ease-in-out hover:shadow-md">
        <svg
          className="text-gray-500 group-hover:text-black"
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8 2.75C8 2.47386 7.77614 2.25 7.5 2.25C7.22386 2.25 7 2.47386 7 2.75V7H2.75C2.47386 7 2.25 7.22386 2.25 7.5C2.25 7.77614 2.47386 8 2.75 8H7V12.25C7 12.5261 7.22386 12.75 7.5 12.75C7.77614 12.75 8 12.5261 8 12.25V8H12.25C12.5261 8 12.75 7.77614 12.75 7.5C12.75 7.22386 12.5261 7 12.25 7H8V2.75Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"></path>
        </svg>
      </div>

      <AppDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} title="Agregar Inventario">
        <InventoryForm onSubmitSuccess={() => setIsDialogOpen(false)} />
      </AppDialog>
    </div>
  );
};

export default Inventories;
