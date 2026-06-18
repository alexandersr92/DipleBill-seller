import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash, Store, User, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import AppDialog from '@/components/ui/AppDialog';
import { getSellers, deleteSeller, ISeller } from '../../sellers/services/sellerService';
import SellerForm from './SellerForm';

export default function SellerSettings() {
  const { toast } = useToast();
  const [sellers, setSellers] = useState<ISeller[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedSeller, setSelectedSeller] = useState<ISeller | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [isOpenDelete, setIsOpenDelete] = useState<boolean>(false);
  const [sellerToDelete, setSellerToDelete] = useState<ISeller | null>(null);

  const fetchSellersList = async () => {
    setIsLoading(true);
    try {
      const data = await getSellers();
      setSellers(data);
    } catch (error) {
      console.error('Error fetching sellers:', error);
      toast({
        title: 'Error al cargar',
        description: 'No se pudieron cargar los vendedores del servidor.',
        variant: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSellersList();
  }, []);

  const handleAddSeller = () => {
    setSelectedSeller(null);
    setShowForm(true);
  };

  const handleEditSeller = (seller: ISeller) => {
    setSelectedSeller(seller);
    setShowForm(true);
  };

  const handleDeleteTrigger = (seller: ISeller) => {
    if (seller.is_owner) {
      toast({
        title: 'Acción no permitida',
        description: 'No puedes eliminar la cuenta de vendedor del Propietario.',
        variant: 'error'
      });
      return;
    }
    setSellerToDelete(seller);
    setIsOpenDelete(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sellerToDelete) return;
    try {
      await deleteSeller(sellerToDelete.id);
      toast({
        title: 'Vendedor eliminado',
        description: 'El vendedor ha sido eliminado con éxito.',
        variant: 'success'
      });
      setIsOpenDelete(false);
      setSellerToDelete(null);
      fetchSellersList();
    } catch (error: any) {
      toast({
        title: 'Error al eliminar',
        description: error.message || 'No se pudo eliminar el vendedor.',
        variant: 'error'
      });
    }
  };

  if (showForm) {
    return (
      <div className="w-full">
        <SellerForm
          seller={selectedSeller}
          onSuccess={() => {
            setShowForm(false);
            fetchSellersList();
          }}
          onCancel={() => setShowForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vendedores</h1>
          <p className="text-sm text-muted-foreground">
            Administra los accesos de facturación por PIN de tus cajeros y vendedores.
          </p>
        </div>
        <Button onClick={handleAddSeller} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Agregar Vendedor
        </Button>
      </div>

      <Separator className="my-4 w-full" />

      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <Icons.spinner className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : sellers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 border border-dashed rounded-lg">
          <User className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">No hay vendedores registrados aún.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sellers.map((seller) => (
            <div
              key={seller.id}
              className="relative p-5 bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground flex items-center gap-1.5">
                        {seller.name}
                        {seller.is_owner && (
                          <span className="flex items-center gap-0.5 text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-medium">
                            <ShieldCheck className="h-3 w-3" /> Owner
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-muted-foreground">Código: {seller.code}</p>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      seller.status === 'active'
                        ? 'bg-green-500/10 text-green-500'
                        : seller.status === 'blocked'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    {seller.status === 'active'
                      ? 'Activo'
                      : seller.status === 'blocked'
                      ? 'Bloqueado'
                      : 'Inactivo'}
                  </span>
                </div>

                <div className="my-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                    <Store className="h-3.5 w-3.5" />
                    <span>Tiendas Asignadas:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {seller.stores && seller.stores.length > 0 ? (
                      seller.stores.map((store) => (
                        <span
                          key={store.id}
                          className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded"
                        >
                          {store.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-destructive font-medium italic">
                        Ninguna sucursal asignada
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t pt-3 mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditSeller(seller)}
                  className="h-8 px-2 flex items-center gap-1 text-xs"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Button>
                {!seller.is_owner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTrigger(seller)}
                    className="h-8 px-2 flex items-center gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash className="h-3.5 w-3.5" />
                    Eliminar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AppDialog
        open={isOpenDelete}
        onOpenChange={setIsOpenDelete}
        title="Eliminar Vendedor"
        description="Esta acción eliminará de forma permanente al vendedor del sistema."
      >
        <div className="p-4 space-y-4">
          <p className="text-sm text-foreground">
            ¿Estás seguro que deseas eliminar permanentemente a{' '}
            <span className="font-bold">{sellerToDelete?.name}</span> (Código:{' '}
            {sellerToDelete?.code})?
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setIsOpenDelete(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Eliminar
            </Button>
          </div>
        </div>
      </AppDialog>
    </div>
  );
}

// Simple loader icon placeholder since Icons spinner is used
const Icons = {
  spinner: ({ className }: { className?: string }) => (
    <svg
      className={`animate-spin ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  )
};
