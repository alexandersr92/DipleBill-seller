import { Receipt, Store } from 'lucide-react';
import { NavMain } from './sidebar/nav-main';
import { NavUser } from './sidebar/nav-user';
import { useAppSelector } from '@/store/hooks';

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
  const { store } = useAppSelector((state) => state.storeSlice);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
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
