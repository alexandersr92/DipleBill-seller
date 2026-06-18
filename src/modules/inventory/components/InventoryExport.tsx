import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { exportInventoryApi } from '../services/inventoryApi';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface IInventoryExportProps {
  id_inventory: string | undefined;
}

const InventoryExport = ({ id_inventory }: IInventoryExportProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleExportInventory = async () => {
    setIsLoading(true);
    if (!id_inventory) {
      alert('El inventario no se ha podido encontrar!');
      return;
    }
    const params = {
      inventory_id: id_inventory
    };

    const res = await exportInventoryApi(params);

    const blob = new Blob([res], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reporte.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
    setIsLoading(false);
  };

  return (
    <Button
      onClick={handleExportInventory}
      variant="outline"
      size="icon"
      className="h-9 min-w-auto px-2 gap-2 flex items-center w-48"
      disabled={isLoading && true}>
      {isLoading ? (
        <Loader2 className="animate-spin w-4 h-4 mr-2" />
      ) : (
        <>
          <Icons.ExcelIcon />
          Descargar Inventario
          <span className="sr-only">Download</span>
        </>
      )}
    </Button>
  );
};

export default InventoryExport;
