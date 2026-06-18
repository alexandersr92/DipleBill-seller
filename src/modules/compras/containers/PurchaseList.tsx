import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { DataTable } from '../../../components/ui/data-table';
import { getPurchases } from '../slices/purchaseThunks';
import { columns } from '../components/Columns';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../../components/ui/select';

export default function PurchaseList() {
  const dispatch = useAppDispatch();
  const isPurchasesLoading = useAppSelector((state) => state.puchaseSlice.isLoading);

  const [purchaseType, setPurchaseType] = useState<'active' | 'cancelled'>('active');
  const activePurchases = useAppSelector((state) => state.puchaseSlice.purchases);
  const cancelledPurchases = useAppSelector((state) => state.puchaseSlice.cancelledPurchases);
  const fetchPurchases = async () => {
    await dispatch(getPurchases());
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  return (
    <>
      <div className="w-full flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold mb-4">Lista de compras</h1>
        <Select onValueChange={(value) => setPurchaseType(value as 'active' | 'cancelled')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Compras Activas" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="active">Activas</SelectItem>
              <SelectItem value="cancelled">Desactivadas</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <DataTable
        searchBy="inventory"
        columns={columns}
        data={purchaseType === 'active' ? activePurchases : cancelledPurchases}
        isLoading={isPurchasesLoading}
      />
    </>
  );
}
