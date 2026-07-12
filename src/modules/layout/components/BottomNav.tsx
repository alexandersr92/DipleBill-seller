import { ShoppingCart, FileText, CreditCard, Coins } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const { pathname } = useLocation();

  const navItems = [
    {
      label: 'Venta',
      path: '/venta',
      icon: ShoppingCart,
      isActive: pathname === '/venta' || pathname === '/'
    },
    {
      label: 'Facturas',
      path: '/invoices',
      icon: FileText,
      isActive: pathname.startsWith('/invoices')
    },
    {
      label: 'Créditos',
      path: '/credits',
      icon: CreditCard,
      isActive: pathname.startsWith('/credits') || pathname.startsWith('/paid-credits')
    },
    {
      label: 'Caja',
      path: '/caja',
      icon: Coins,
      isActive: pathname.startsWith('/caja')
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 border-t bg-background/80 backdrop-blur-md shadow-lg flex items-center justify-around px-2 pb-safe">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            to={item.path}
            className={cn(
              'flex flex-col items-center justify-center flex-1 h-full py-1 text-xs font-medium transition-all duration-200 select-none touch-manipulation',
              item.isActive
                ? 'text-primary scale-105'
                : 'text-muted-foreground hover:text-foreground active:scale-95'
            )}>
            <div
              className={cn(
                'relative flex items-center justify-center px-5 py-1.5 rounded-full mb-1 transition-colors duration-200',
                item.isActive ? 'bg-primary/10' : 'bg-transparent'
              )}>
              <Icon className="h-5 w-5" />
              {item.isActive && (
                <span className="absolute inset-0 rounded-full border border-primary/20 animate-pulse-once-accent" />
              )}
            </div>
            <span className="text-[10px] tracking-wide font-semibold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
