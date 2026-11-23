import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/hooks/use-toast';
import { IInvoiceProduct } from '@diplebill/core';

interface FreeInvoiceItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: {
    description: string;
    quantity: number;
    cost: number;
    price: number;
    discount: number;
    tax: number;
    temp_id?: string;
  }) => void;
  initialItem?: IInvoiceProduct | null;
}

export const FreeInvoiceItemModal: React.FC<FreeInvoiceItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
}) => {
  const { toast } = useToast();
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [cost, setCost] = useState('0');
  const [price, setPrice] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [tax, setTax] = useState('0');

  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        setDescription(initialItem.description || initialItem.name || '');
        setQuantity(initialItem.quantity ? initialItem.quantity.toString() : '1');
        setCost(initialItem.cost !== undefined ? initialItem.cost.toString() : '0');
        setPrice(initialItem.price !== undefined ? initialItem.price.toString() : '0');
        setDiscount(initialItem.discount !== undefined ? initialItem.discount.toString() : '0');
        setTax(initialItem.tax !== undefined ? initialItem.tax.toString() : '0');
      } else {
        setDescription('');
        setQuantity('1');
        setCost('0');
        setPrice('0');
        setDiscount('0');
        setTax('0');
      }
    }
  }, [isOpen, initialItem]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      toast({
        title: 'Descripción requerida',
        description: 'Debe ingresar una descripción para el concepto libre.',
        variant: 'destructive',
      });
      return;
    }

    const numQty = parseFloat(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      toast({
        title: 'Cantidad inválida',
        description: 'La cantidad debe ser mayor a 0.',
        variant: 'destructive',
      });
      return;
    }

    const numCost = parseFloat(cost);
    if (isNaN(numCost) || numCost < 0) {
      toast({
        title: 'Costo inválido',
        description: 'El costo unitario no puede ser negativo.',
        variant: 'destructive',
      });
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      toast({
        title: 'Precio inválido',
        description: 'El precio unitario no puede ser negativo.',
        variant: 'destructive',
      });
      return;
    }

    const numDiscount = parseFloat(discount) || 0;
    const numTax = parseFloat(tax) || 0;

    onSave({
      description: trimmedDesc,
      quantity: numQty,
      cost: numCost,
      price: numPrice,
      discount: numDiscount,
      tax: numTax,
      temp_id: initialItem?.temp_id,
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialItem ? 'Editar concepto libre' : 'Agregar concepto libre'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="free-item-desc" className="text-sm font-medium">
              Descripción <span className="text-red-500">*</span>
            </Label>
            <Input
              id="free-item-desc"
              placeholder="Ej. Servicio de entrega, Asesoría..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="free-item-qty" className="text-sm font-medium">
                Cantidad <span className="text-red-500">*</span>
              </Label>
              <Input
                id="free-item-qty"
                type="number"
                step="any"
                min="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="free-item-cost" className="text-sm font-medium">
                Costo unitario <span className="text-red-500">*</span>
              </Label>
              <Input
                id="free-item-cost"
                type="number"
                step="any"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
              <span className="text-[11px] text-muted-foreground block">
                Uso interno (no se imprime en recibos)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="free-item-price" className="text-sm font-medium">
                Precio de venta <span className="text-red-500">*</span>
              </Label>
              <Input
                id="free-item-price"
                type="number"
                step="any"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="free-item-discount" className="text-sm font-medium">
                Descuento
              </Label>
              <Input
                id="free-item-discount"
                type="number"
                step="any"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {initialItem ? 'Guardar cambios' : 'Agregar concepto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
