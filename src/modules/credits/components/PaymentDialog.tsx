import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CreditInvoice, ICreditInvoicePayment } from '../types';
import { useToast } from '@/components/hooks/use-toast';
import { useAppDispatch } from '@/store/hooks';
import { getCreditById, payCredit } from '../services/creditsThunks';
import { calculateCreditTotals } from '../slices/creditsSlice';
import { Icons } from '@/components/ui/icons';

interface PaymentDialogProps {
  invoice: CreditInvoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentDialog({ invoice, open, onOpenChange }: PaymentDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset
  } = useForm<ICreditInvoicePayment>({
    defaultValues: {
      amount: parseFloat(invoice.current_debt.toFixed(2)),
      credits_id: [invoice.id]
    }
  });

  const amount = watch('amount');

  const onSubmit = async (data: ICreditInvoicePayment) => {
    const dataParsed = {
      ...data,
      credits_id: JSON.stringify(data.credits_id)
    };

    setIsProcessing(true);
  
    try {
      const response = await dispatch(payCredit(dataParsed)).unwrap();
      
      setIsComplete(true);
      reset();
  
      setTimeout(() => {
        onOpenChange(false);
        setIsComplete(false);
      }, 1000);
  
      toast({
        title: 'Listo!',
        description: 'Las facturas seleccionadas han sido pagadas exitosamente!',
        variant: 'success'
      });
  
      dispatch(calculateCreditTotals());

      try {
        await dispatch(getCreditById(response[0].id)).unwrap();
      } catch (error: unknown) {
        if (import.meta.env.DEV) console.error('Error retrieving new payment record', error);
      }
    } catch (error: unknown) {
      console.error('Payment error:', error);
      toast({
        title: 'UPS!, Ha ocurrido un error al realizar el pago!',
        variant: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (invoice) {
      reset({
        amount: parseFloat(invoice.current_debt.toFixed(2)),
        credits_id: [invoice.id]
      });
    }
  }, [invoice, reset]);

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) reset();
        onOpenChange(open);
      }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Pagar Factura {invoice.invoice_number}</DialogTitle>
        </DialogHeader>

        {isComplete ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-green-100 p-3 mb-3">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">Pago Exitoso!</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Factura {invoice.invoice_number} ha sido pagada exitosamente.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Detalles de la factura</h3>
                <div className="grid grid-cols-2 gap-1 text-sm">
                  <div className="text-muted-foreground">Numero de Factura:</div>
                  <div>{invoice.invoice_number}</div>
                  <div className="text-muted-foreground">Monto restante:</div>
                  <div>C$ {invoice.current_debt.toFixed(2)}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Input
                  className="focus-visible:ring-0 focus-visible:ring-offset-0"
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Monto"
                  {...register('amount', {
                    required: 'El monto es obligatorio',
                    valueAsNumber: true,
                    validate: {
                      positive: (value) => value > 0 || 'El monto debe ser mayor a 0',
                      maxAmount: (value) =>
                        value <= invoice.current_debt ||
                        `El monto no puede ser mayor a ${invoice.current_debt}`
                    }
                  })}
                />
                {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}

                <Textarea
                  className="focus-visible:ring-0 focus-visible:ring-offset-0"
                  id="note"
                  placeholder="Notas - Opcional"
                  {...register('note')}
                />

                <Input type="hidden" id="credits_id" {...register('credits_id')} />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={
                  isNaN(amount) || amount <= 0 || amount > invoice.current_debt || isProcessing
                }>
                {isProcessing && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                {isProcessing
                  ? 'Procesando...' 
                  : `Pagar $${amount && !isNaN(amount) ? amount.toFixed(2) : '0.00'}`}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}