import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem
} from '@/components/ui/AppDropdownMenu';
import { CreditCard, MoreHorizontal, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CreditInvoice, ICreditInvoicePayment } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
// import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/hooks/use-toast';
import { payInvoicesApi } from '../services/creditsApi';
import { getCreditById } from '../services/creditsThunks';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { PaymentDialog } from './PaymentDialog';
import { AppBadge } from '@/components/ui/AppBadge';
import { useNavigate } from 'react-router';

interface RelatedInvoicesProps {
  data: CreditInvoice[];
}

const RelatedInvoices = ({ data }: RelatedInvoicesProps) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectInvoices] = useState<string[]>([]);
  const historialAlreadyExists = useAppSelector((state) => state.creditsSlice.invoice);
  const navigate = useNavigate();

  const dispatch = useAppDispatch();

  const [selectedInvoice, setSelectedInvoice] = useState<CreditInvoice | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const filteredInvoices = data.filter((invoice) =>
    invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // const handleSelectAll = () => {
  //   setSelectInvoices(
  //     selectInvoices.length === data.length ? [] : data.map((invoice) => invoice.id)
  //   );
  // };

  // const handleCheckboxChange = (invoiceId: string) => {
  //   setSelectInvoices((prevSelected) =>
  //     prevSelected.includes(invoiceId)
  //       ? prevSelected.filter((id) => id !== invoiceId)
  //       : [...prevSelected, invoiceId]
  //   );
  // };

  const handlePayInvoice = async (id?: string) => {
    const newPay: ICreditInvoicePayment = {
      amount: data.reduce((total, invoice) => {
        if (selectInvoices.includes(invoice.id)) {
          return total + invoice.amount;
        } else if (invoice.id === id) {
          return total + invoice.amount;
        }
        return total;
      }, 0),
      note: '',
      credits_id: id ? [id] : selectInvoices
    };

    try {
      if (newPay) {
        console.log(newPay);

        const response = await payInvoicesApi(newPay);
        if (response) {
          toast({
            title: 'Listo!',
            description: 'Las facturas seleccionadas han sido pagadas exitosamente!',
            variant: 'success'
          });
        }
      }
    } catch (error) {
      toast({
        title: 'Error al procesar pago',
        description: 'No se han podido pagar las facturas seleccionadas',
        variant: 'error'
      });

      console.log('Error, trying pay an invoice', error);
    }
  };

  const handleViewHistory = async (id?: string) => {
    if (!id) return;

    if (
      !historialAlreadyExists ||
      historialAlreadyExists.id !== id ||
      !historialAlreadyExists.paymentsHistory?.length
    ) {
      try {
        await dispatch(getCreditById(id)).unwrap();
      } catch (error) {
        console.log('Error, getting credit information', error);
      }
    }
  };

  useEffect(() => {
    if (data.length === 0) return;

    const firstInvoiceId = data[0].id;
    const hasSelectedInvoiceFromCurrentList = data.some(
      (invoice) => invoice.id === historialAlreadyExists?.id
    );

    if (hasSelectedInvoiceFromCurrentList) {
      return;
    }

    const promise = dispatch(getCreditById(firstInvoiceId));

    return () => {
      promise.abort();
    };
  }, [data, dispatch, historialAlreadyExists?.id]);

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <div className="flex flex-col flex-wrap lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle>Facturas relacionadas</CardTitle>
              <CardDescription>Facturas asociadas con este crédito</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar factura..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {selectInvoices.length > 0 && (
              <div className="flex items-center justify-end w-full -mb-4">
                <Button
                  type="button"
                  tabIndex={-1}
                  onClick={() => handlePayInvoice()}
                  className="bg-theme_blue text-white text-xs hover:bg-primary focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue hover:text-white transition-colors duration-300 ease-in-out"
                  variant={'ghost'}>
                  Pagar facturas seleccionadas
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent
          className="h-72 overflow-y-auto
          [&::-webkit-scrollbar]:w-1
          [&::-webkit-scrollbar-track]:rounded-full
          [&::-webkit-scrollbar-track]:bg-gray-100
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-gray-300
          dark:[&::-webkit-scrollbar-track]:bg-neutral-700
          dark:[&::-webkit-scrollbar-thumb]:bg-neutral-500">
          {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No hay facturas todavia</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                No hay facturas asociadas a este crédito todavia, apareceran aqui una vez sean
                creadas.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {/* <TableHead className="w-[50px]">
                    <Checkbox
                      className="focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue"
                      onClick={handleSelectAll}
                      checked={
                        selectInvoices.length === data.length && data.length !== 0
                          ? true
                          : selectInvoices.length > 0
                            ? 'indeterminate'
                            : false
                      }
                    />
                  </TableHead> */}
                  <TableHead className="w-fit">Factura</TableHead>
                  <TableHead className="hidden md:table-cell">Fecha</TableHead>
                  <TableHead>
                    <div className="flex items-center">Crédito Total</div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center">Crédito Pendiente</div>
                  </TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    {/* <TableCell className="py-1">
                      <Checkbox
                        className="focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-theme_blue"
                        checked={selectInvoices.includes(invoice.id)}
                        onCheckedChange={() => handleCheckboxChange(invoice.id)}
                      />
                    </TableCell> */}
                    <TableCell className="font-medium underline text-theme_blue cursor-pointer">
                      <Button variant={'link'} onClick={() => handleViewHistory(invoice.id)}>
                        {invoice.invoice_number}
                      </Button>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {format(invoice.created_at, "d 'de' MMMM, yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>C$ {invoice.amount.toFixed(2)}</TableCell>
                    <TableCell>C$ {invoice.current_debt.toFixed(2)}</TableCell>
                    <TableCell>
                      <AppBadge variant={invoice.status === 'active' ? 'warning' : 'success'}>
                        {invoice.status === 'active' ? 'Pendiente' : 'Completado'}
                      </AppBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => navigate(`/invoices/${invoice.invoice_id}`)}>
                            Ver Factura
                          </DropdownMenuItem>
                          {invoice.status !== 'paid' && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                // setIsDropdownOpen(false);
                                setPaymentDialogOpen(true);
                                setSelectedInvoice(invoice);
                              }}>
                              Pagar factura
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedInvoice && (
        <>
          <PaymentDialog
            invoice={selectedInvoice}
            open={paymentDialogOpen}
            onOpenChange={setPaymentDialogOpen}
          />
        </>
      )}
    </>
  );
};

export default RelatedInvoices;
