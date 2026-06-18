import * as yup from 'yup';
import { allowedUnitValues } from './units';

// Acepta tanto los valores canónicos en español como sus alias en inglés
const allowedUnits = allowedUnitValues;

export const productSchema = yup.object().shape({
  name: yup.string().required('El nombre es requerido'),
  categories: yup.string().nullable().notRequired(),
  barcode: yup.string().nullable().notRequired(),
  unit_of_measure: yup
    .string()
    .oneOf(allowedUnits, 'Unidad de medida no válida')
    .required('La unidad de medida es requerida'),
  description: yup.string().nullable().notRequired(),
  image: yup.mixed().nullable(),
  price: yup
    .string()
    .required('El precio es requerido')
    .matches(/^\d+(\.\d{1,2})?$/, 'El precio debe ser un número válido con hasta 2 decimales')
    .test('is-positive', 'El precio no puede ser negativo', (value) => parseFloat(value) >= 0),
  min_stock: yup
    .number()
    .transform((value) => (isNaN(value) ? undefined : value))
    .nullable()
    .integer('El mínimo de stock debe ser un número entero')
    .min(0, 'El mínimo de stock no puede ser negativo')
    .required('El mínimo de stock es requerido'),
  tags: yup.string().nullable().notRequired(),
  sku: yup.string().required('El SKU es requerido'),
  suppliers: yup.string().required('El proveedor es requerido'),
  inventory: yup.string().when('$isEditing', {
    is: true,
    then: (schema) => schema.nullable(),
    otherwise: (schema) => schema.required('El inventario es requerido')
  }),
  cost: yup.string().required('El costo es requerido')
});

export const updateProductSchema = yup.object().shape({
  sku: yup.string().required('El SKU es requerido'),
  barcode: yup.string().required('El código de barras es requerido'),
  name: yup.string().required('El nombre es requerido'),
  description: yup.string().required('La descripción es requerida'),
  price: yup
    .string()
    .required('El precio es requerido')
    .matches(/^\d+(\.\d{1,2})?$/, 'El precio debe ser un número válido con hasta 2 decimales')
    .test('is-positive', 'El precio no puede ser negativo', (value) => parseFloat(value) >= 0),
  min_stock: yup
    .number()
    .transform((value) => (isNaN(value) ? undefined : value))
    .nullable()
    .integer('El mínimo de stock debe ser un número entero')
    .min(0, 'El mínimo de stock no puede ser negativo')
    .required('El mínimo de stock es requerido'),
  unit_of_measure: yup
    .string()
    .oneOf(allowedUnits, 'Unidad de medida no válida')
    .required('La unidad de medida es requerida'),
  suppliers: yup.string().required('El proveedor es requerido'),
  inventory: yup.string().when('$isEditing', {
    is: true,
    then: (schema) => schema.nullable(),
    otherwise: (schema) => schema.required('El inventario es requerido')
  })
});

export type ProductForm = yup.InferType<typeof productSchema>;
export type UpdateProductForm = yup.InferType<typeof updateProductSchema>;
