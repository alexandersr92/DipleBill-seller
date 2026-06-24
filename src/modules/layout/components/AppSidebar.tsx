import { Receipt, Store } from 'lucide-react';
import { NavMain } from './sidebar/nav-main';
import { NavUser } from './sidebar/nav-user';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCurrentStore } from '@/modules/stores/slices/storeThunks';
import { sellerLogout } from '@/modules/auth/slices/userSlice';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail
} from '@/components/ui/sidebar';

const data = {
  navMain: [
    {
      title: 'Facturación',
      url: '#',
      icon: Receipt,
      isActive: true,
      items: [
        {
          title: 'Nueva Venta',
          url: '/venta'
        },
        {
          title: 'Facturas',
          url: '/invoices'
        }
      ]
    }
  ]
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const dispatch = useAppDispatch();
  const { store, stores } = useAppSelector((state) => state.storeSlice);

  const handleStoreChange = (storeId: string) => {
    localStorage.setItem('currentStoreId', storeId);
    dispatch(fetchCurrentStore(storeId));
    
    // Al cambiar de sucursal, cerramos sesión del vendedor actual por seguridad
    localStorage.removeItem('seller_id');
    localStorage.removeItem('seller_name');
    localStorage.removeItem('seller_code');
    dispatch(sellerLogout());
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-4 border-b border-sidebar-border animate-in fade-in duration-200">
        {stores.length > 1 ? (
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80 px-1 flex items-center gap-1 select-none">
              <Store className="w-3 h-3 text-sidebar-primary animate-pulse" />
              Sucursal Activa
            </label>
            <Select value={store?.id || ''} onValueChange={handleStoreChange}>
              <SelectTrigger className="h-9 w-full bg-transparent border-sidebar-border text-sidebar-foreground focus:ring-0 focus:ring-offset-0">
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
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Store className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="font-semibold truncate">{store?.name || 'Cargando...'}</span>
              <span className="text-xs text-muted-foreground truncate">
                {store?.address || 'Punto de Venta'}
              </span>
            </div>
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
