import { Textarea } from '@/components/ui/textarea';

import { Input } from '@/components/ui/input';

import { Button } from '@/components/ui/button';
import { Params, useParams, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { ISingleInvoice, SELL_TYPES } from '../types';
import { cancelInvoiceById, getInvoiceById } from '../services/billingApi';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { currencyFormatter } from '../helpers';
import InvoiceSkeleton from '../components/InvoiceSkeleton';
import { useToast } from '@/components/hooks/use-toast';
import { ActionButtons } from '../components/ActionButtons';
import OwnerPasswordConfirmDialog from '@/modules/auth/components/OwnerPasswordConfirmDialog';

const Invoice = () => {
  const { id }: Params = useParams();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [invoice, setInvoice] = useState<ISingleInvoice>();

  const navigate = useNavigate();
  const { toast } = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);

  const get = async () => {
    setIsLoading(true);

    if (id) {
      const response = await getInvoiceById(id);
      setInvoice(response.data);
      setIsLoading(false);
    }

    setIsLoading(false);
  };

  const cancelInvoice = async () => {
    try {
      setIsLoading(true);

      if (id) {
        const response = await cancelInvoiceById(id);
        if (response) {
          toast({
            title: 'Listo!',
            description: 'Se ha anulado esta factura correctamente!',
            variant: 'success'
          });
          navigate('/invoices');
          setIsLoading(false);
        }
      }

      setIsLoading(false);
    } catch (error) {
      toast({
        title: 'Error al anular factura',
        description: 'No se ha podido anular esta factura',
        variant: 'error'
      });
      if (import.meta.env.DEV) console.error(error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    try {
      get();
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      toast({
        title: 'Error al cargar factura',
        description: 'No se pudo obtener los datos de la factura.',
        variant: 'error'
      });
    }
  }, [id]);

  return (
    <>
      {isLoading ? (
        <InvoiceSkeleton />
      ) : (
        <section>
          <section className="rounded-md shadow-sm p-4 border mb-4">
            <div className="w-full text-sm border-0 border-b pb-2">
              <h1 className="text-2xl font-bold">Factura #{invoice?.invoice_number}</h1>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8">
              <div className="w-full flex flex-wrap">
                <label className="text-sm mb-1" htmlFor="">
                  Cliente
                </label>
                <Input
                  readOnly
                  disabled
                  className="h-10 border-gray-500"
                  value={invoice?.client_name}
                />
              </div>

              <div className="w-full flex flex-wrap">
                <label className="text-sm mb-1" htmlFor="">
                  Fecha de la factura
                </label>
                <Input
                  readOnly
                  disabled
                  className="h-10 border-gray-500"
                  value={invoice?.invoice_date}
                />
              </div>

              <div className="w-full">
                <label className="text-sm mb-1" htmlFor="">
                  Tipo de venta
                </label>
                <Input
                  readOnly
                  disabled
                  className="h-10 border-gray-500 capitalize"
                  value={
                    invoice?.invoice_type === 'credit'
                      ? SELL_TYPES.CREDITO && 'crédito'
                      : SELL_TYPES.CONTADO && 'Contado'
                  }
                />
              </div>
              <div className="w-full">
                <label className="text-sm mb-1" htmlFor="">
                  Fecha de vencimiento
                </label>
                <Input
                  readOnly
                  disabled
                  className="h-10 border-gray-500"
                  value={invoice?.invoice_date}
                />
              </div>

              <div className="w-full">
                <label className="text-sm mb-1" htmlFor="">
                  Vendedor
                </label>
                <Input readOnly disabled className="h-10 border-gray-500" value="emila@emai.com" />
              </div>
              <div className="w-full">
                <label className="text-sm mb-1" htmlFor="">
                  Método de pago
                </label>
                <Input
                  readOnly
                  disabled
                  className="h-10 border-gray-500"
                  value={
                    invoice?.method === 'CASH'
                      ? 'Efectivo'
                      : invoice?.method === 'TRANSFER'
                        ? 'Transferencia'
                        : invoice?.method === 'CARD'
                          ? 'Tarjeta'
                          : invoice?.method === 'CREDIT'
                            ? 'Crédito'
                            : invoice?.method === 'MULTIPLE'
                              ? 'Múltiple'
                              : invoice?.method || 'Efectivo'
                  }
                />
              </div>

              {invoice?.payment_metadata && (
                <div className="w-full xl:col-span-1 sm:col-span-2 flex gap-2 flex-wrap items-start flex-col">
                  <label className="text-sm mb-1">
                    Detalles del Pago
                  </label>
                  <Input
                    readOnly
                    disabled
                    className="h-10 border-gray-500 w-full text-xs font-semibold"
                    value={
                      invoice.method === 'CASH'
                        ? `Pagó C$ ${invoice.payment_metadata.paid_nio || 0} + $${invoice.payment_metadata.paid_usd || 0} USD (Tasa ${invoice.payment_metadata.exchange_rate || 36.5}) | Vuelto: C$ ${invoice.payment_metadata.change_nio || 0}`
                        : invoice.method === 'TRANSFER'
                          ? `Banco: ${invoice.payment_metadata.bank} | Ref: ${invoice.payment_metadata.reference}`
                          : invoice.method === 'CARD'
                            ? `${invoice.payment_metadata.card_brand || 'Tarjeta'} (*${invoice.payment_metadata.card_last_four || '0000'}) | Ref: ${invoice.payment_metadata.reference}`
                            : invoice.method === 'MULTIPLE'
                              ? (invoice.payment_metadata.payments || []).map((p: any) => {
                                  if (p.method === 'CASH') {
                                    return `Efectivo: C$ ${(p.amount || 0).toFixed(2)} (Recibido: C$ ${p.paid_nio || 0} + $${p.paid_usd || 0} USD, Vuelto: C$ ${p.change_nio || 0})`;
                                  }
                                  if (p.method === 'TRANSFER') {
                                    return `Transf: C$ ${(p.amount || 0).toFixed(2)} (${p.bank} - Ref: ${p.reference})`;
                                  }
                                  if (p.method === 'CARD') {
                                    return `Tarjeta: C$ ${(p.amount || 0).toFixed(2)} (${p.card_brand} *${p.card_last_four} - Ref: ${p.reference})`;
                                  }
                                  return `${p.method}: C$ ${(p.amount || 0).toFixed(2)}`;
                                }).join(' | ')
                              : JSON.stringify(invoice.payment_metadata)
                    }
                  />
                </div>
              )}

              <div className="w-full xl:col-span-1 sm:col-span-2 flex gap-2 flex-wrap items-start flex-col">
                <label className="text-sm mb-1" htmlFor="">
                  Detalles de la factura
                </label>
                <Textarea
                  readOnly
                  value={invoice?.invoice_note || ''}
                  disabled
                  tabIndex={4}
                  className="h-10 border-gray-500"
                />
              </div>
            </div>
          </section>

          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-inherit">
                  <TableHead className="text-[#71717A] py-4">Producto</TableHead>
                  <TableHead className="w-[200px] text-[#71717A] text-center py-4">
                    Cantidad
                  </TableHead>
                  <TableHead className="w-[150px] text-[#71717A] text-right py-4">Precio</TableHead>
                  <TableHead className="w-[150px] text-[#71717A] text-right py-4">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice?.invoice_details.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="py-3">{product.product_name}</TableCell>
                    <TableCell className="py-3 text-center">{product.quantity}</TableCell>
                    <TableCell className="text-right py-3">
                      {currencyFormatter({ currency: 'NIO', value: product.price })}
                    </TableCell>
                    <TableCell className="text-right py-3">
                      {currencyFormatter({ currency: 'NIO', value: product.total })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end mt-4">
            <div className="w-2/5 [&_*]:border-none [&_tr]:hover:bg-inherit [&_td]:py-1">
              <Table>
                <TableBody className="">
                  <TableRow>
                    <TableCell className="text-left font-bold w-1/2">Productos Totales </TableCell>
                    <TableCell className="text-right font-bold">{invoice?.total_items}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-left w-1/2">Subtotal </TableCell>
                    <TableCell className="text-right">
                      C$ {((invoice?.grand_total ?? 0) - (invoice?.discount ?? 0)).toFixed(2)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-left w-1/2">
                      Descuento
                      <span className="ml-2 text-sm">
                        (C$ /
                        {Math.round(
                          ((invoice?.discount ?? 0) /
                            ((invoice?.grand_total ?? 0) + (invoice?.discount ?? 0))) *
                            100
                        )}
                        %)
                      </span>
                    </TableCell>
                    <TableCell className="text-right">C$ {invoice?.discount}</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className="text-left w-1/2">
                      <span className="text-lg font-bold">Total </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-lg font-bold">C$ {invoice?.grand_total}</span>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="pt-4 w-full flex justify-end gap-3 items-center">
            {invoice && <ActionButtons invoice={invoice} />}
            <Button
              disabled={invoice?.invoice_status === 'canceled'}
              onClick={() => setIsConfirmOpen(true)}
              tabIndex={-1}
              className="bg-theme_blue hover:bg-[#f4f4f5] hover:text-black border border-transparent hover:border-gray-500"
            >
              Anular factura
            </Button>
            <OwnerPasswordConfirmDialog
              open={isConfirmOpen}
              onOpenChange={setIsConfirmOpen}
              onConfirm={cancelInvoice}
              title="Anular Factura"
              description="Se requiere la contraseña del propietario para anular esta factura."
            />
          </div>
        </section>
      )}
    </>
  );
};

export default Invoice;
