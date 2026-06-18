import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../../../components/ui/table';
import { IComprasProduct } from '../types/compras.types';
import { Input } from '../../../components/ui/input';

interface IEditTableProps {
  products: IComprasProduct[];
  onUpdate: (updatedProducts: IComprasProduct) => void;
  isEdit: boolean;
}

export default function EditTable({ products, onUpdate, isEdit }: IEditTableProps) {
  const [editing, setEditing] = useState<{ row: number; field: keyof IComprasProduct } | null>(
    null
  );
  const [editedProduct, setEditedProduct] = useState<IComprasProduct | null>(null);
  const editableFields: (keyof IComprasProduct)[] = ['quantity', 'cost', 'price'];

  const handleClick = (rowIndex: number, field: keyof IComprasProduct) => {
    if (!isEdit) return;
    if (!editableFields.includes(field)) return;

    setEditedProduct((prev) => prev ?? { ...products[rowIndex] });
    setEditing({ row: rowIndex, field });
  };

  const handleChange = (field: keyof IComprasProduct, value: string) => {
    if (!editedProduct) return;

    setEditedProduct((prev) => {
      if (!prev) return null;

      const newValue: IComprasProduct[typeof field] = ['quantity', 'price', 'cost'].includes(field)
        ? Number(value) || 0
        : value;

      return { ...prev, [field]: newValue };
    });
  };

  const handleBlur = () => {
    setEditing(null);

    if (editedProduct) {
      onUpdate(editedProduct);
      setEditedProduct(null);
    }
  };
  return (
    <Table className="border-collapse w-full">
      <TableHeader className="sticky top-0 bg-secondary z-10">
        <TableRow className="border-b ">
          <TableHead className="border- text-foreground">SKU</TableHead>
          <TableHead className="border- text-foreground">Nombre</TableHead>
          <TableHead className="border- text-foreground">Código de barras</TableHead>
          <TableHead className="border- text-foreground">Cantidad</TableHead>
          <TableHead className="border- text-foreground">Costo</TableHead>
          <TableHead className="border- text-foreground">Precio</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product, rowIndex) => (
          <TableRow key={rowIndex} className="border-b">
            {(
              [
                'sku',
                'product_name',
                'barcode',
                'quantity',
                'cost',
                'price'
              ] as (keyof IComprasProduct)[]
            ).map((field) => (
              <TableCell
                key={field}
                className={`border-r ${
                  isEdit
                    ? editableFields.includes(field)
                      ? 'cursor-pointer'
                      : 'cursor-not-allowed'
                    : ''
                }`}
                onDoubleClick={() => handleClick(rowIndex, field)}
                onClick={() => handleClick(rowIndex, field)}>
                {editing?.row === rowIndex && editing?.field === field ? (
                  <Input
                    type={['quantity', 'price', 'cost'].includes(field) ? 'number' : 'text'}
                    className="w-full border-none outline-none p-1"
                    value={editedProduct?.[field] ?? product[field] ?? ''}
                    onChange={(e) => handleChange(field, e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
                    autoFocus
                  />
                ) : ['price', 'cost'].includes(field) && typeof product[field] === 'number' ? (
                  `$${(product[field] as number).toFixed(2)}`
                ) : (
                  (product[field] ?? 'N/A')
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
