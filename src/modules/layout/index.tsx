import { useAppSelector } from '../../store/hooks';
import { Skeleton } from '../../components/ui/skeleton';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';

export default function Layout({ children }: { children: React.ReactNode }) {
  const isLoading = useAppSelector((state) => state.storeSlice.isLoading);

  return (
    <div className="relative min-h-screen flex flex-col bg-background text-foreground pb-[var(--bottom-nav-height)]">
      <TopBar />
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 animate-in fade-in duration-300">
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
