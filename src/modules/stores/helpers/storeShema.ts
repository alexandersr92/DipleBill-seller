import { mixed, number, object, string } from 'yup';

export const storeSchema = object().shape({
  name: string().lowercase().required('El nombre es requerido').trim(),
  description: string().lowercase().required('La descripción es requerida').trim(),
  email: string().email('El correo no es válido').trim().required('El correo es requerido').trim(),
  phone: string().required('El teléfono es requerido'),
  address: string().required('La dirección es requerida'),
  city: string().lowercase().required('La ciudad es requerida'),
  state: string().lowercase().required('El departamento es requerido'),
  country: string().required('El país es requerido'),
  zip: string().optional(),
  print_logo: mixed<File | string>().optional().nullable(),
  print_header: string().optional().nullable(),
  print_footer: string().optional().nullable(),
  print_note: string().optional().nullable(),
  print_width: string().optional().nullable(),
  invoice_number: number().optional().nullable(),
  invoice_prefix: string().optional().nullable(),
  store_currency: string().optional().nullable()
});
