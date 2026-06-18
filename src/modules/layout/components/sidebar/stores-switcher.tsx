import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, Store } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import AppDialog from '@/components/ui/AppDialog';
import { Button } from '@/components/ui/button';
import { DropdownMenuContent } from '../../../../components/ui/AppDropdownMenu';
import StoreForm from '@/modules/stores/components/StoreForm';
import { fetchCurrentStore, fetchStores } from '../../../stores/slices/storeThunks';

import { Skeleton } from '../../../../components/ui/skeleton';
import { useNavigate } from 'react-router';

export function StoresSwitcher() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { stores, store } = useAppSelector((state) => state.storeSlice);
  const { isMobile } = useSidebar();
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const isloading = useAppSelector((state) => state.storeSlice.isLoading);
  const { orgId, isAuthenticated } = useAppSelector((state) => state.userSlice);

  useEffect(() => {
    if (isAuthenticated && !orgId && !isloading) {
      navigate('/organization');
    }
  }, [isAuthenticated, orgId, isloading, navigate]);

  const handleClose = () => {
    setIsOpen(false);
    setIsOpenDropdown(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsOpenDropdown(false);
  };

  useEffect(() => {
    dispatch(fetchStores());
  }, [dispatch]);

  useEffect(() => {
    if (!stores.length && !isloading) {
      setIsOpen(true);
      return;
    }

    if (!stores.length || store) return;

    const savedId = localStorage.getItem('currentStoreId');
    const targetId =
      savedId && stores.some((s) => s.id === savedId) ? savedId : stores[0]?.id;

    if (targetId) {
      localStorage.setItem('currentStoreId', targetId);
      dispatch(fetchCurrentStore(targetId));
    }
  }, [stores, store, isloading, dispatch]);

  if (isloading) {
    return <Skeleton className="h-8 w-full" />;
  }

  return (
    <>
      <SidebarMenu>
        {!stores.length && !isloading ? (
          <>
            <SidebarMenuItem>
              <Button
                onClick={handleOpen}
                variant="default"
                className=" w-full flex items-center gap-4 text-sm">
                Agregar
                <Store className="size-4 shrink-0" />
              </Button>
            </SidebarMenuItem>
            <AppDialog
              open={isOpen}
              onOpenChange={() => setIsOpen(!isOpen)}
              title={`Agregar  Tienda`}
              description="Registra una tienda en el sistema!"
              className="sm:max-w-[825px] max-h-[85vh] overflow-y-auto">
              <StoreForm closeDialog={handleClose} isNewStore />
            </AppDialog>
          </>
        ) : (
          <>
            <SidebarMenuItem>
              <DropdownMenu open={isOpenDropdown} onOpenChange={setIsOpenDropdown}>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground w-full">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <Store className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{store?.name}</span>
                      <span className="truncate text-xs">{store?.address}</span>
                    </div>
                    <ChevronsUpDown className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  align="start"
                  side={isMobile ? 'bottom' : 'right'}
                  sideOffset={4}>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Tiendas
                  </DropdownMenuLabel>
                  {stores.map((storeItem) => (
                    <DropdownMenuItem
                      key={storeItem.name}
                      onClick={() => {
                        dispatch(fetchCurrentStore(storeItem.id));
                        localStorage.setItem('currentStoreId', storeItem.id);
                      }}
                      className="gap-2 p-2 cursor-pointer relative">
                      <div className="flex size-6 items-center justify-center rounded-sm border">
                        <Store className="size-4 shrink-0" />
                      </div>
                      {storeItem.name}
                      {storeItem.id === store?.id && (
                        <Check className="size-4 ml-2 absolute right-4 top-1/2 -translate-y-1/2" />
                      )}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </>
        )}
      </SidebarMenu>
    </>
  );
}
