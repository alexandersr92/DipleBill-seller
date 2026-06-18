import { array, boolean, object, string } from 'yup';

export const ClientSchema = object().shape({
  name: string().required('El nombre es obligatorio!'),
  email: string().email('Debe ser un email válido!').required('El email es obligatorio!'),
  phone: string().required('El teléfono es obligatorio!'),
  address: string().required('La dirección es obligatoria!'),
  city: string().required('La ciudad es obligatoria!'),
  state: string().required('El estado es obligatorio!'),
  country: string().required('El país es obligatorio!'),
  wholesaler: boolean().default(false).optional(),
  has_credit: boolean().default(false).optional(),
  notes: string().default('...'),
  stores: array().of(string()).notRequired().nullable()
});
