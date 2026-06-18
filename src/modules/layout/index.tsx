import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './components/AppSidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';

import { Link, matchPath, useLocation, useParams } from 'react-router-dom';
import routes from '@/router/routeList';
import { useAppSelector } from '../../store/hooks';
import { Skeleton } from '../../components/ui/skeleton';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { id } = useParams<{ id: string }>();

  const currentRoute = Object.values(routes).find((route) => matchPath(route.path, pathname));
  const isDynamicRoute = id && currentRoute?.path.includes(':id');
  const routeFounded = isDynamicRoute ? pathname.split('/').slice(0, -1).join('/') : pathname;

  const isLoading = useAppSelector((state) => state.storeSlice.isLoading);

  const routeModified = routeFounded.includes('edit')
    ? routeFounded.split('/').slice(0, -1).join('/')
    : routeFounded;

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <header className="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-4 z-50">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />

            {pathname !== '/' && (
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/">Inicio</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />

                  {isDynamicRoute ? (
                    <>
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link to={routeModified ?? ''}>{currentRoute?.name}</Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                    </>
                  ) : (
                    <BreadcrumbItem>
                      <BreadcrumbPage>{currentRoute?.name}</BreadcrumbPage>
                    </BreadcrumbItem>
                  )}
                </BreadcrumbList>
              </Breadcrumb>
            )}
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          {isLoading ? <Skeleton className="w-full h-screen" /> : children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
