import { Button } from '@/components/ui/button';
import { ButtonProps } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { ISingleInvoice } from '../types';
import { useAppSelector } from '@/store/hooks';
import { invoiceActions } from '../helpers/print';
import { useState } from 'react';
import { useToast } from '@/components/hooks/use-toast';

interface IActionButtonsProps {
  invoice?: ISingleInvoice;
  printButtonRef?: React.Ref<HTMLButtonElement>;
  downloadButtonRef?: React.Ref<HTMLButtonElement>;
  printButtonProps?: ButtonProps;
  downloadButtonProps?: ButtonProps;
}

export const ActionButtons = ({
  invoice,
  printButtonRef,
  downloadButtonRef,
  printButtonProps,
  downloadButtonProps
}: IActionButtonsProps) => {
  const printInfo = useAppSelector((state) => state.storeSlice.store);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  /***
   *
   * Se pasara la factura como si se hiciera una consulta al API,
   * Cuando se genere una nueva, el objeto estara en la respuesta
   * cuando se hace desde las facturas, se pasara el objeto de la factura con la estructura de ISingleInvoice
   * de ISingleInvoice se obtiene la informacion necesaria para generar el PDF y Print
   *
   */

  const handleDownloadInvoice = async () => {
    if (!invoice) {
      toast({
        title: 'Factura no disponible',
        description: 'No se pudo obtener la información necesaria para descargar el PDF.',
        variant: 'error'
      });
      return;
    }

    if (!printInfo) {
      toast({
        title: 'Configuración de impresión no disponible',
        description: 'Verifica la información de la tienda antes de continuar.',
        variant: 'error'
      });
      return;
    }

    try {
      setIsDownloading(true);
      await invoiceActions({
        settings: {
          store_id: printInfo.id,
          print_logo: printInfo.print_logo ?? '',
          print_header: printInfo.print_header ?? '',
          print_footer: printInfo.print_footer ?? '',
          address: printInfo.address ?? '',
          phone: printInfo.phone ?? '',
          invoice_prefix: printInfo.invoice_prefix ?? '',
          print_width: parseInt(printInfo.print_width ?? '80', 10),
          print_note: printInfo.print_note ?? '',
          store_currency: printInfo.store_currency ?? '',
          ruc: printInfo.ruc ?? ''
        },
        invoice,
        action: 'download'
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error al descargar el PDF:', error);
      toast({
        title: 'Error al descargar el PDF',
        description: 'No se pudo generar el archivo en este momento.',
        variant: 'error'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintInvoice = async () => {
    if (!invoice) {
      toast({
        title: 'Factura no disponible',
        description: 'No se pudo obtener la información necesaria para imprimir.',
        variant: 'error'
      });
      return;
    }

    if (!printInfo) {
      toast({
        title: 'Configuración de impresión no disponible',
        description: 'Verifica la información de la tienda antes de continuar.',
        variant: 'error'
      });
      return;
    }

    try {
      await invoiceActions({
        settings: {
          store_id: printInfo.id,
          print_logo: printInfo.print_logo ?? '',
          print_header: printInfo.print_header ?? '',
          print_footer: printInfo.print_footer ?? '',
          address: printInfo.address ?? '',
          phone: printInfo.phone ?? '',
          invoice_prefix: printInfo.invoice_prefix ?? '',
          print_width: parseInt(printInfo.print_width ?? '80', 10),
          print_note: printInfo.print_note ?? '',
          store_currency: printInfo.store_currency ?? '',
          ruc: printInfo.ruc ?? ''
        },
        invoice,
        action: 'print'
      });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error al imprimir la factura:', error);
      toast({
        title: 'Error al imprimir la factura',
        description: 'No se pudo completar la impresión en este momento.',
        variant: 'error'
      });
    }
  };

  return (
    <>
      <Button type="button" ref={printButtonRef} onClick={handlePrintInvoice} {...printButtonProps}>
        <Printer width={16} height={16} className="mr-2" />
        Imprimir
      </Button>

      <Button
        type="button"
        ref={downloadButtonRef}
        onClick={handleDownloadInvoice}
        {...downloadButtonProps}
        disabled={isDownloading || downloadButtonProps?.disabled}
      >
        <svg
          className="text-secondary mr-2 group-hover:text-black"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 256 256"
        >
          <path
            fill="currentColor"
            d="M44 120h168a4 4 0 0 0 4-4V88a8 8 0 0 0-2.34-5.66l-56-56A8 8 0 0 0 152 24H56a16 16 0 0 0-16 16v76a4 4 0 0 0 4 4m108-76l44 44h-44Zm72 108.53a8.18 8.18 0 0 1-8.25 7.47H192v16h15.73a8.17 8.17 0 0 1 8.25 7.47a8 8 0 0 1-8 8.53H192v15.73a8.17 8.17 0 0 1-7.47 8.25a8 8 0 0 1-8.53-8V152a8 8 0 0 1 8-8h32a8 8 0 0 1 8 8.53M64 144H48a8 8 0 0 0-8 8v55.73a8.17 8.17 0 0 0 7.47 8.27a8 8 0 0 0 8.53-8v-8h7.4c15.24 0 28.14-11.92 28.59-27.15A28 28 0 0 0 64 144m-.35 40H56v-24h8a12 12 0 0 1 12 13.16A12.25 12.25 0 0 1 63.65 184M128 144h-16a8 8 0 0 0-8 8v56a8 8 0 0 0 8 8h15.32c19.66 0 36.21-15.48 36.67-35.13A36 36 0 0 0 128 144m-.49 56H120v-40h8a20 20 0 0 1 20 20.77c-.42 10.82-9.66 19.23-20.49 19.23"
          />
        </svg>
        {isDownloading ? (
          <span className="inline-flex items-center">
            <Loader2 className="ml-1 h-4 w-4 animate-spin" />
            <span className="ml-2">Generando…</span>
          </span>
        ) : (
          'Descargar PDF'
        )}
      </Button>
    </>
  );
};
