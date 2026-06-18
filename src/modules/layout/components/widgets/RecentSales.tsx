import { ComponentProps, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { getAllInvoices } from '@/modules/billing/services/billingThunks';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { ArrowUpRight, Landmark } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

type IRecentSalesProps = ComponentProps<'div'>;

const RecentSalesWidget: React.FC<IRecentSalesProps> = ({ className }) => {
  const { isLoading } = useAppSelector((state) => state.billingSlice);
  const recentSales = useAppSelector((state) => state.billingSlice.invoices);
  const dispatch = useAppDispatch();

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    dispatch(
      getAllInvoices({
        per_page: 10,
        order: 'asc',
        search: '',
        search_by: 'name',
        date_from: today,
        date_to: today
      })
    );
  }, []);

  const grandTotalSales = useMemo(() => {
    return recentSales.reduce((sum, invoice) => sum + invoice.grand_total || 0, 0);
  }, [recentSales]);

  if (isLoading) return <Card className={className}>Cargando...</Card>;

  return (
    <Card className={className}>
      <CardHeader className="bg-primary/5 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Ventas recientes</CardTitle>
          <div className="rounded-full bg-primary/10 p-2">
            <Landmark className="h-4 w-4 text-primary" />
          </div>
        </div>
        <CardDescription>Ventas de hoy</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-6">
          <p className="text-2xl font-bold">C$ {grandTotalSales.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Ventas Totales</p>
        </div>
        <div className="border-t">
          {recentSales.slice(0, 7).map((sale) => (
            <Link
              to={`/invoices/${sale.id}`}
              key={sale.id}
              className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium">{sale.client_name}</p>
                <p className="text-sm text-muted-foreground">{sale.invoice_date}</p>
              </div>
              <p className="font-medium">C${sale.grand_total}</p>
            </Link>
          ))}
        </div>
      </CardContent>
      <CardFooter className="border-t p-4">
        <Link
          to={`/invoices?date_from=${today}&date_to=${today}`}
          className="w-full justify-between flex items-center py-2">
          Ver todas las ventas
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  );
};

export default RecentSalesWidget;
