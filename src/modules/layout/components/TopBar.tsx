import { Store, User, ChevronsUpDown, PaintRoller, Sun, Moon, Laptop2, LogOut } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCurrentStore } from '@/modules/stores/slices/storeThunks';
import { sellerLogout } from '@/modules/auth/slices/userSlice';
import { performLogout } from '@/modules/auth/services/authService';
import { useTheme } from '@/components/theme-provider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@/components/ui/AppDropdownMenu';
import { Button } from '@/components/ui/button';

export function TopBar() {
  const dispatch = useAppDispatch();
  const { setTheme } = useTheme();
  const { store, stores } = useAppSelector((state) => state.storeSlice);
  const user = useAppSelector((state) => state.userSlice);

  const handleStoreChange = (storeId: string) => {
    localStorage.setItem('currentStoreId', storeId);
    dispatch(fetchCurrentStore(storeId));

    // Al cambiar de sucursal, cerramos sesión del vendedor actual por seguridad
    localStorage.removeItem('seller_id');
    localStorage.removeItem('seller_name');
    localStorage.removeItem('seller_code');
    dispatch(sellerLogout());
  };

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
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b bg-background px-4 md:px-6 shadow-sm">
      {/* Lado Izquierdo: Sucursal */}
      <div className="flex items-center gap-2 max-w-[60%]">
        {stores.length > 1 ? (
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-primary shrink-0" />
            <Select value={store?.id || ''} onValueChange={handleStoreChange}>
              <SelectTrigger className="h-9 w-[180px] bg-transparent border-input focus:ring-1 focus:ring-ring text-sm font-medium">
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
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Store className="h-5 w-5" />
            </div>
            <div className="grid text-left leading-tight">
              <span className="font-semibold text-sm truncate">{store?.name || 'Sucursal'}</span>
              <span className="text-[11px] text-muted-foreground truncate max-w-[200px] md:max-w-xs">
                {store?.address || 'Punto de Venta'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Lado Derecho: Usuario */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex h-10 gap-2 px-2 hover:bg-accent hover:text-accent-foreground select-none rounded-lg">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </div>
              <div className="hidden md:grid text-left text-xs leading-none">
                <span className="font-medium truncate max-w-[100px]">
                  {user.sellerName || 'Vendedor'}
                </span>
                <span className="text-[10px] text-muted-foreground truncate">
                  {user.sellerCode ? `Cód: ${user.sellerCode}` : ''}
                </span>
              </div>
              <ChevronsUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mt-1" align="end" sideOffset={4}>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-semibold leading-none">
                  {user.sellerName || 'Vendedor'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <PaintRoller className="mr-2 h-4 w-4" />
                  <span>Tema</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => setTheme('dark')}>
                      <Moon className="mr-2 h-4 w-4" />
                      <span>Oscuro</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => setTheme('light')}>
                      <Sun className="mr-2 h-4 w-4" />
                      <span>Claro</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer" onClick={() => setTheme('system')}>
                      <Laptop2 className="mr-2 h-4 w-4" />
                      <span>Sistema</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSellerLogout}
              className="cursor-pointer text-amber-500 focus:text-amber-500">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cambiar Vendedor</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleFullLogout}
              className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar Sesión Admin</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
