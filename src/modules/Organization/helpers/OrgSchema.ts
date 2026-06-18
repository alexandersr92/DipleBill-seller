import { mixed, object, string } from 'yup';

export const organizationSchema = object().shape({
  name: string().required('El nombre es requerido').trim(),
  email: string().email('El correo no es válido').trim().required('El correo es requerido'),
  phone: string().required('El teléfono es requerido'),
  website: string().url('La URL del sitio web no es válida').trim().optional(),
  logo: mixed(),
  description: string().required('La descripción es requerida')
});
