import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { ICurrentStore, IStore } from '../../stores/slices/store.types';
import { deleteStore, getStoreById } from '../../stores/services/storeService';
import StoreForm from '@/modules/stores/components/StoreForm';
import StoreCard from './StoreCard';
import { Separator } from '../../../components/ui/separator';
import { ChevronLeft, Trash } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import AddStoreCard from './AddStoreCard';
import AppDialog from '../../../components/ui/AppDialog';
import { useToast } from '../../../components/hooks/use-toast';
import { fetchStores } from '../../stores/slices/storeThunks';

export default function StoreSettings() {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const stores = useAppSelector((state) => state.storeSlice.stores);
  const [selectedStore, setSelectedStore] = useState<ICurrentStore | null>(null);
  const [isNewStore, setIsNewStore] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleStoreSelection = async (store: IStore) => {
    const res = await getStoreById(store.id);
    setSelectedStore(res.data);
  };

  const handleAddStore = () => {
    setIsNewStore(true);
  };

  const handleStoreDelete = async () => {
    if (!selectedStore) return;

    try {
      const res = await deleteStore(selectedStore.id);
      if (res.status === 204) {
        toast({
          title: 'Tienda eliminada exitosamente',
          variant: 'error'
        });
        dispatch(fetchStores());
        setSelectedStore(null);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Error deleting store:', error);
    }
  };

  return (
    <>
      {!selectedStore ? (
        <>
          {isNewStore ? (
            <div className="w-full">
              <div className="w-full flex items-center mb-4">
                <Button variant={'ghost'} onClick={() => setIsNewStore(false)}>
                  <ChevronLeft />
                </Button>
                <h1 className="text-2xl font-bold">Agregar una tienda</h1>
              </div>
              <Separator className="my-4 w-full" />
              <StoreForm isNewStore />
            </div>
          ) : (
            <div className="h-screen bg-transparent w-full p-4 grid grid-rows-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-8 ">
              {stores.map((store: IStore) => (
                <StoreCard key={store.id} store={store} setStore={handleStoreSelection} />
              ))}
              {!isNewStore && <AddStoreCard setIsnewStore={handleAddStore} />}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="w-full flex items-center mb-4">
            <Button variant={'ghost'} onClick={() => setSelectedStore(null)}>
              <ChevronLeft />
            </Button>
            <div className="flex items-center justify-between mb-4"></div>
            <h1 className="text-2xl font-bold">Configuracion de tiendas</h1>
          </div>

          <Separator className="my-4 w-full" />
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold mb-4 ">{selectedStore.name}</h2>

            <Button
              variant="ghost"
              size="sm"
              className="mb-4 flex items-center justify-center"
              onClick={() => {
                setIsOpen(true);
              }}>
              <Trash color="red" />
            </Button>
          </div>

          <section>
            <StoreForm storeId={selectedStore.id} isNewStore={false} />
          </section>

          <AppDialog
            open={isOpen}
            onOpenChange={setIsOpen}
            title="Eliminar Tienda"
            description="Esta accion no se puede deshacer">
            <section>
              <h2>¿Estas seguro que quiere eliminar {selectedStore?.name}?</h2>
              <div className="flex items-center justify-end mt-4 gap-4">
                <Button variant="secondary" className="ml-2" onClick={() => setIsOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={handleStoreDelete}>
                  Eliminar
                </Button>
              </div>
            </section>
          </AppDialog>
        </>
      )}
    </>
  );
}
