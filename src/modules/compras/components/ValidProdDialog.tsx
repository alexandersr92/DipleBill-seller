import { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../../components/ui/table';
import { IComprasProduct } from '../types/compras.types';

interface ProductDialogProps {
  products: IComprasProduct[];
}

export default function ValidProdDialog({ products }: ProductDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (products.length > 0) {
      setIsOpen(true);
    }
  }, [products]);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Detalles de Productos</DialogTitle>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto">
          <Table className="border-collapse w-full">
            <TableHeader>
              <TableRow className="border-b">
                <TableHead className="border-r">SKU</TableHead>
                <TableHead className="border-r">Nombre</TableHead>
                <TableHead className="border-r">Código de barras</TableHead>
                <TableHead className="border-r">Precio</TableHead>
                <TableHead className="border-r">Cantidad</TableHead>
                <TableHead className="border-r">Costo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, index) => (
                <TableRow key={index} className="border-b">
                  <TableCell className="border-r">{product.sku ?? 'N/A'}</TableCell>
                  <TableCell className="border-r">{product.product_name ?? 'N/A'}</TableCell>
                  <TableCell className="border-r">{product.barcode ?? 'N/A'}</TableCell>
                  <TableCell className="border-r">
                    {product.price ? `$${product.price.toFixed(2)}` : 'N/A'}
                  </TableCell>
                  <TableCell className="border-r">{product.quantity ?? 'N/A'}</TableCell>
                  <TableCell className="border-r">
                    {product.cost ? `$${product.cost.toFixed(2)}` : 'N/A'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-end">
          <Button
            onClick={() => {
              setIsOpen(false);
            }}>
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
