import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppSelector } from '@/store/hooks';
import { CreditCard, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';

interface IPayment {
  id: string;
  amount: number;
  date: string;
  note: null | string;
  created_at: string;
}

const PaymentsHistory = () => {
  const isLoading = useAppSelector((state) => state.creditsSlice.isLoading);
  const invoice = useAppSelector((state) => state.creditsSlice.invoice);
  const creditSummary = useAppSelector((state) => state.creditsSlice.creditSummary);

  const [paymentHistory, setPaymentHistory] = useState<IPayment[]>([]);

  useEffect(() => {
    if (invoice?.paymentsHistory) {
      const sortedPayments = [...invoice.paymentsHistory].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setPaymentHistory(sortedPayments);
    } else {
      setPaymentHistory([]);
    }
  }, [invoice?.paymentsHistory, creditSummary]);

  useEffect(() => {
    setPaymentHistory([]);
  }, [creditSummary]);

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Historial de abonos</CardTitle>
            <CardDescription>
              Aqui se mostraran los abonos realizados a este crédito
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent
        className="h-[32rem] overflow-y-auto
        [&::-webkit-scrollbar]:w-1
        [&::-webkit-scrollbar-track]:rounded-full
        [&::-webkit-scrollbar-track]:bg-gray-100
        [&::-webkit-scrollbar-thumb]:rounded-full
        [&::-webkit-scrollbar-thumb]:bg-gray-300
        dark:[&::-webkit-scrollbar-track]:bg-neutral-700
        dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
        {isLoading && <div className="h-10 animate-pulse rounded-md bg-muted"></div>}

        {!isLoading && paymentHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-muted p-3 mb-3">
              <Receipt className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              No hay historial de abonos disponibles en este crédito.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {!isLoading &&
              paymentHistory.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0">
                  <div className="space-y-1 w-8/12">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">
                        Abono #{new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="underline text-theme_blue">
                        <Link to={`/invoices/${invoice?.invoice.id}`}>
                          {invoice?.invoice.invoice_number}
                        </Link>
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center flex-wrap w-4/12">
                    <div className="flex items-center justify-end w-full gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="font-medium">C${payment.amount}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentsHistory;
