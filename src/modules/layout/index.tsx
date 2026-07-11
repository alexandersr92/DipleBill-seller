import { useAppSelector } from '../../store/hooks';
import { Skeleton } from '../../components/ui/skeleton';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { useLocation } from 'react-router';

export default function Layout({ children }: { children: React.ReactNode }) {
  const isLoading = useAppSelector((state) => state.storeSlice.isLoading);
  const { pathname } = useLocation();
  const isVentaPage = pathname === '/venta';

  return (
    <div className="relative min-h-screen flex flex-col bg-background text-foreground pb-[var(--bottom-nav-height)]">
      {!isVentaPage && <TopBar />}
      <main
        className={`flex-grow flex flex-col w-full animate-in fade-in duration-300 ${
          isVentaPage
            ? 'max-w-none p-0 h-[calc(100vh-var(--bottom-nav-height))] overflow-hidden'
            : 'max-w-7xl mx-auto p-4 md:p-6'
        }`}>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-[250px]" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : (
          children
        )}
      </main>
      <BottomNav />
    </div>
  );
}
