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
import { IInvalidProduct } from '../types/compras.types';
import { useState, useEffect } from 'react';

interface InvalidProdDialogProps {
  invalidProducts: IInvalidProduct[];
  fileReset: () => void;
}

export default function InvalidProdDialog({ invalidProducts, fileReset }: InvalidProdDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = () => {
    fileReset();
    setIsOpen(false);
  };

  useEffect(() => {
    if (invalidProducts.length > 0) {
      setIsOpen(true);
    }
  }, [invalidProducts]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Productos Inválidos</DialogTitle>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto">
          <Table className="border-separate border-spacing-y-2">
            <TableHeader>
              <TableRow className="border-b">
                <TableHead className="border-r">Fila</TableHead>
                <TableHead>Errores</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invalidProducts.map((product, index) => (
                <TableRow key={index} className="border-b">
                  <TableCell className="border-r">{product.row}</TableCell>
                  <TableCell>{product.errors.join(', ')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleClose}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
