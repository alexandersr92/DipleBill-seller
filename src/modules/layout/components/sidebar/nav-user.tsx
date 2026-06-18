import {
  ChevronsUpDown,
  Laptop2,
  LogOut,
  Moon,
  PaintRoller,
  Sun,
  User
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/AppDropdownMenu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import {
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '../../../../components/ui/dropdown-menu';
import { useTheme } from '../../../../components/theme-provider';
import { performLogout } from '../../../auth/services/authService';
import { sellerLogout } from '../../../auth/slices/userSlice';

export function NavUser() {
  const dispatch = useAppDispatch();
  const { setTheme } = useTheme();
  const { isMobile } = useSidebar();
  const user = useAppSelector((state) => state.userSlice);

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

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <User className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.sellerName || 'Vendedor'}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.sellerCode ? `Cód: ${user.sellerCode}` : user.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.sellerName || 'Vendedor'}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="w-full flex items-center justify-start gap-2">
                  <PaintRoller className="w-4 h-4" />
                  Tema
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      className="cursor-pointer bg-transparent dark:bg-secondary"
                      onClick={() => setTheme('dark')}>
                      <span>Oscuro</span>
                      <Moon className="ml-auto h-4 w-4" />
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer bg-secondary dark:bg-transparent"
                      onClick={() => setTheme('light')}>
                      <span>Claro</span>
                      <Sun className="ml-auto h-4 w-4" />
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer bg-transparent"
                      onClick={() => setTheme('system')}>
                      <span>Sistema</span>
                      <Laptop2 className="ml-auto h-4 w-4" />
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSellerLogout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4 text-amber-500" />
              <span className="text-amber-500 font-medium">Cambiar Vendedor</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleFullLogout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4 text-destructive" />
              <span className="text-destructive font-medium">Cerrar Sesión Admin</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
