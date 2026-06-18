import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppSelector } from '@/store/hooks';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ClientInformation = () => {
  const creditInformation = useAppSelector(
    (state) => state.creditsSlice.currentCredit
  );

  const creditSummary = useAppSelector(
    (state) => state.creditsSlice.creditSummary
  );
  

  const client_name = creditInformation ? creditInformation[0].client : 'N/A';
  const date = creditInformation ? creditInformation[0].created_at : new Date();
  const amount = creditSummary ? creditSummary.totalAmount : 0;
  const current_debt = creditSummary ? creditSummary.totalCurrentDebt : 0;
  const status = creditInformation ? creditInformation[0].status : 'active';

  // const usedAmount = amount - current_debt
  // const usagePercentage = (usedAmount / amount) * 100
  

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <CardTitle>Detalles del crédito</CardTitle>
            <CardDescription>Información sobre este crédito</CardDescription>
          </div>
          <Badge variant="default" className="w-fit">
            {status === 'active' ? 'Activo' : 'Pagado'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm font-medium">Cliente</p>
            <p className="text-sm text-muted-foreground">{client_name}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Fecha de emisión</p>
            <p className="text-sm text-muted-foreground">
              {format(date, 'dd-MM-yyyy', { locale: es })}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Crédito Total</p>
            <p className="text-sm text-muted-foreground">C$ {amount.toFixed(2)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Crédito pendiente</p>
            <p className="text-sm text-muted-foreground">C$ {current_debt.toFixed(2)}</p>
          </div>
          {/* <div className="md:col-span-2 pt-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Utilizado</p>
                <p className="text-sm text-muted-foreground">{usagePercentage.toFixed(0)}%</p>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${status === "activo" ? "bg-secondary" : "bg-primary"}`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <p>Crédito utilizado: C$ {usedAmount.toFixed(2)}</p>
                <p>Crédito pendiente: C$ {current_debt.toFixed(2)}</p>
              </div>
            </div>
          </div> */}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientInformation;