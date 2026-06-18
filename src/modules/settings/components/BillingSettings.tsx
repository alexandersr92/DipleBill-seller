import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '../../../components/ui/switch';

export default function BillingSettings() {
  const [shareCustomers, setShareCustomers] = useState<boolean>(false);
  const [allowNegativePurchase, setAllowNegativePurchase] = useState<boolean>(false);
  const [allowNoStockSales, setAllowNoStockSales] = useState<boolean>(false);

  return (
    <div className="flex flex-col items-center gap-4 justify-center p-4 bg-transparent rounded-lg shadow-sm">
      <div className="flex items-center justify-between w-full bg-background p-4 rounded-lg border border-secondary">
        <Label htmlFor="share-customers" className="text-sm">
          Compartir clientes entre tiendas
        </Label>
        <Switch checked={shareCustomers} onCheckedChange={setShareCustomers} />
      </div>

      <div className="flex items-center justify-between w-full bg-background p-4 rounded-lg border border-secondary">
        <Label htmlFor="negative-purchase" className="text-sm">
          Compra negativa para realizar devoluciones y/o cambios
        </Label>
        <Switch checked={allowNegativePurchase} onCheckedChange={setAllowNegativePurchase} />
      </div>

      <div className="flex items-center justify-between w-full bg-background p-4 rounded-lg border border-secondary">
        <Label htmlFor="negative-purchase" className="text-sm">
          permitir la venta de productos sin existencias.
        </Label>
        <Switch checked={allowNoStockSales} onCheckedChange={setAllowNoStockSales} />
      </div>
    </div>
  );
}
