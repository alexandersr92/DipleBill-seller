import RelatedInvoices from '../components/RelatedInvoices';
import PaymentsHistory from '../components/PaymentsHistory';
import ClientInformation from '../components/ClientInformation';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useToast } from '@/components/hooks/use-toast';
import { getCreditClientById } from '../services/creditsThunks';
import { CreditInvoice } from '../types';

export default function CreditPage() {
  const { id } = useParams();
  const [relatedInvoices, setRelatedInvoices] = useState<CreditInvoice[]>([]);
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const credits = useAppSelector((state) => state.creditsSlice.currentCredit);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    const promise = dispatch(getCreditClientById(id));

    promise
      .unwrap()
      .then((response) => {
        if (cancelled) return;
        setRelatedInvoices(response.data);
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof Error && error.name === 'AbortError') return;
        if (
          typeof error === 'object' &&
          error !== null &&
          'name' in error &&
          error.name === 'AbortError'
        ) {
          return;
        }

        toast({
          title: 'Error al cargar crédito',
          description: 'No se pudieron obtener los datos del crédito.',
          variant: 'error'
        });
      });

    return () => {
      cancelled = true;
      promise.abort();
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (credits && credits.length > 0) {
      setRelatedInvoices(credits);
    }
  }, [credits]);

  return (
    <div className="container mx-auto py-6 pt-0">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ClientInformation />
          <div className="mt-6 overflow-hidden max-h-96">
            <RelatedInvoices data={relatedInvoices} />
          </div>
        </div>
        <div className="max-h-[40rem] overflow-hidden">
          <PaymentsHistory />
        </div>
      </div>
    </div>
  );
}
