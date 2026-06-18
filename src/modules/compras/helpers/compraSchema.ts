import { object, string, number, mixed } from 'yup';

export const compraSchema = object({
  storeId: string().required('La tienda es requerida'),
  inventory_id: string().required('El inventario es requerido'),
  supplier_id: string().nullable(),
  purchase_date: string().required('La fecha de compra es requerida'),
  total: number().nullable(),
  purchase_note: string().nullable(),
  excelFile: mixed<FileList>().nullable()
});
