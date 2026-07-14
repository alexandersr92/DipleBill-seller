import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/AppDropdownMenu';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Trash } from 'lucide-react';
import { cancelInvoice } from '../services/billingThunks';
import { cancelInvoiceById } from '../slices/billingSlice';
import { useToast } from '@/components/hooks/use-toast';
import { invoiceActions } from '../helpers/print';
import { useState } from 'react';
import { ISingleInvoice } from '@diplebill/core';
import { getInvoiceById } from '../services/billingApi';
import OwnerPasswordConfirmDialog from '@/modules/auth/components/OwnerPasswordConfirmDialog';

import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';

interface InvoiceListActionsProps {
  id: string;
  invoiceStatus?: string;
}

const InvoiceListActions = ({ id, invoiceStatus }: InvoiceListActionsProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const printInfo = useAppSelector((state) => state.storeSlice.store);
  const [invoice, setInvoice] = useState<ISingleInvoice>();
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const handleDelete = async () => {
    if (!id) return;

    try {
      await dispatch(cancelInvoice(id)).unwrap();
      dispatch(cancelInvoiceById(id));

      toast({
        title: 'Factura cancelada exitosamente',
        variant: 'success'
      });
    } catch (error) {
      console.error('Failed to cancel invoice:', error);
      toast({
        title: 'Error al cancelar la factura',
        variant: 'error'
      });
    }
  };

  const downloadPDF = async () => {
    if (!id) return;

    try {
      if (!printInfo) {
        toast({
          title: 'Configuración de impresión no disponible',
          description: 'Verifica la información de la tienda antes de continuar.',
          variant: 'error'
        });
        return;
      }

      setIsDownloadingPDF(true);
      setMenuOpen(true);

      let targetInvoice = invoice;

      if (!targetInvoice) {
        try {
          const response = await getInvoiceById(id);
          targetInvoice = response.data;
          setInvoice(targetInvoice);
        } catch (error) {
          console.error('Error al obtener la factura:', error);
          toast({
            title: 'Error al generar el PDF',
            description: 'No se pudo obtener la información de la factura.',
            variant: 'error'
          });
          return;
        }
      }

      if (!targetInvoice) {
        toast({
          title: 'Factura no disponible',
          description: 'No se pudo generar el PDF porque los datos son inválidos.',
          variant: 'error'
        });

        return;
      }

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
        invoice: targetInvoice,
        action: 'download'
      });

      toast({
        title: 'Factura descargada correctamente',
        variant: 'success'
      });
    } catch (error) {
      console.error('Error inesperado al generar el PDF:', error);
      toast({
        title: 'Error inesperado',
        description: 'Ocurrió un problema al generar o descargar el PDF.',
        variant: 'error'
      });
    } finally {
      setIsDownloadingPDF(false);
      setMenuOpen(false);
    }
  };

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menú</span>
            <Icons.DotsHorizontalIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              downloadPDF();
            }}
            disabled={isDownloadingPDF}>
            <svg
              className="text-theme_blue"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 256 256">
              <path
                fill="currentColor"
                d="M44 120h168a4 4 0 0 0 4-4V88a8 8 0 0 0-2.34-5.66l-56-56A8 8 0 0 0 152 24H56a16 16 0 0 0-16 16v76a4 4 0 0 0 4 4m108-76l44 44h-44Zm72 108.53a8.18 8.18 0 0 1-8.25 7.47H192v16h15.73a8.17 8.17 0 0 1 8.25 7.47a8 8 0 0 1-8 8.53H192v15.73a8.17 8.17 0 0 1-7.47 8.25a8 8 0 0 1-8.53-8V152a8 8 0 0 1 8-8h32a8 8 0 0 1 8 8.53M64 144H48a8 8 0 0 0-8 8v55.73a8.17 8.17 0 0 0 7.47 8.27a8 8 0 0 0 8.53-8v-8h7.4c15.24 0 28.14-11.92 28.59-27.15A28 28 0 0 0 64 144m-.35 40H56v-24h8a12 12 0 0 1 12 13.16A12.25 12.25 0 0 1 63.65 184M128 144h-16a8 8 0 0 0-8 8v56a8 8 0 0 0 8 8h15.32c19.66 0 36.21-15.48 36.67-35.13A36 36 0 0 0 128 144m-.49 56H120v-40h8a20 20 0 0 1 20 20.77c-.42 10.82-9.66 19.23-20.49 19.23"
              />
            </svg>
            {isDownloadingPDF ? 'Generando...' : 'Descargar PDF'}
          </DropdownMenuItem>
          {invoiceStatus === 'proforma' && (
            <DropdownMenuItem
              onSelect={() => navigate(`/venta?proforma_id=${id}`)}
            >
              <ShoppingCart className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />
              Facturar en POS
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setIsConfirmOpen(true);
            }}
            disabled={isDownloadingPDF}>
            <Trash className="w-4 h-4 text-red-500" strokeWidth={1.5} />
            Anular Factura
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <OwnerPasswordConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={handleDelete}
        title="Anular Factura"
        description="Se requiere la contraseña del propietario para anular esta factura."
      />
    </>
  );
};

export default InvoiceListActions;
