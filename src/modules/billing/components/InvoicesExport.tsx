import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '../../../components/ui/icons';
import { ISingleInvoice } from '../types';

interface IInvoiceExportProps {
  data?: ISingleInvoice[];
}

const InvoicesExport: React.FC<IInvoiceExportProps> = ({ data }) => {
  const exportData =
    data?.map((item) => ({
      fecha: item.invoice_date,
      cliente: item.client_name,
      numero_factura: item.invoice_number,
      total_items: item.total_items,
      total: item.grand_total.toString(),
      estado: item.invoice_status
    })) || [];

  const totalItems = data?.reduce((sum, item) => sum + item.total_items, 0) ?? 0;
  const grandTotal = data?.reduce((sum, item) => sum + item.grand_total, 0) ?? 0;

  const handleExportCsv = useCallback(() => {
    const header = ['fecha', 'nombre cliente', 'numero factura', 'total items', 'total', 'estado'];
    const rows = exportData.map((r) => [
      r.fecha,
      r.cliente,
      r.numero_factura,
      r.total_items,
      r.total,
      r.estado
    ]);

    const summary = [
      ['Items Totales', '', String(totalItems)],
      ['Gran Total', '', String(grandTotal)]
    ];

    const allRows = [header, ...rows, ...summary];
    const csv = allRows
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'facturas.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportData, totalItems, grandTotal]);

  return (
    <Button
      onClick={handleExportCsv}
      variant="ghost"
      size="icon"
      className="h-9 w-auto px-2 gap-2 flex items-center"
    >
      <Icons.ExcelIcon />
      Exportar facturas
      <span className="sr-only">Exportar Facturas</span>
    </Button>
  );
};

export default InvoicesExport;
