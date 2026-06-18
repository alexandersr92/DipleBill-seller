import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ClientsWidget from './components/widgets/Clients';
import RevenueWidget from './components/widgets/Revenue';
import SalesWidget from './components/widgets/Sales';
import GeneralWidget from './components/widgets/General';
import RecentSalesWidget from './components/widgets/RecentSales';

export default function Home() {
  return (
    <div className="flex-col md:flex max-w-[86rem] mx-auto">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <RevenueWidget />
          <ClientsWidget />
          <SalesWidget />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activo</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+573</div>
              <p className="text-xs text-muted-foreground">+201 desde la ultima hora</p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-8">
          <GeneralWidget className="col-span-4" />
          <RecentSalesWidget className="col-span-4" />
        </div>
      </div>
    </div>
  );
}
