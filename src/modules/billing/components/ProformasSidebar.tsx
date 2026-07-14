import { useEffect, useState, useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';
import { getInvoices } from '../services/billingApi';
import { currencyFormatter } from '../helpers';
import { FileText, Loader2, RefreshCw, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Proforma {
  id: string;
  invoice_number: string;
  client_name: string;
  grand_total: number;
  created_at: string;
}

interface ProformasSidebarProps {
  onLoadProforma: (id: string) => void;
}

const ProformasSidebar = ({ onLoadProforma }: ProformasSidebarProps) => {
  const store = useAppSelector((state) => state.storeSlice.store);
  const [proformas, setProformas] = useState<Proforma[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProformas = useCallback(async () => {
    if (!store?.id) return;
    setIsLoading(true);
    try {
      const response = await getInvoices({
        store_id: store.id,
        invoice_status: 'proforma',
        per_page: 8,
        page: 1,
        sort_by: 'created_at',
        order: 'desc'
      } as any);
      const data = Array.isArray(response?.data) ? response.data : [];
      setProformas(data);
    } catch {
      setProformas([]);
    } finally {
      setIsLoading(false);
    }
  }, [store?.id]);

  useEffect(() => {
    fetchProformas();
  }, [fetchProformas]);

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 pt-3 mt-1">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
          Proformas recientes
        </h4>
        <button
          type="button"
          onClick={fetchProformas}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Actualizar">
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-4 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
          <span className="text-xs">Cargando...</span>
        </div>
      )}

      {!isLoading && proformas.length === 0 && (
        <div className="text-center py-4">
          <FileText className="w-6 h-6 text-muted-foreground/40 mx-auto mb-1" />
          <p className="text-[11px] text-muted-foreground">No hay proformas</p>
        </div>
      )}

      {!isLoading && proformas.length > 0 && (
        <ul className="flex flex-col gap-1">
          {proformas.map((p) => (
            <li key={p.id}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onLoadProforma(p.id)}
                className="w-full h-auto py-2 px-2.5 flex flex-col items-start gap-0.5 text-left rounded-md hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-800 dark:hover:text-amber-300 group transition-colors border border-transparent hover:border-amber-200 dark:hover:border-amber-800">
                <div className="flex items-center justify-between w-full">
                  <span className="text-[11px] font-bold leading-none">
                    #{p.invoice_number}
                  </span>
                  <ShoppingCart className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-amber-600" />
                </div>
                <span className="text-[10px] text-muted-foreground truncate max-w-full leading-none">
                  {p.client_name || 'Sin cliente'}
                </span>
                <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 leading-none">
                  {currencyFormatter({ currency: 'NIO', value: p.grand_total })}
                </span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProformasSidebar;
