import { array, object, string } from 'yup';

export const contactSchema = object().shape({
  id: string(),
  name: string().required('El nombre es requerido'),
  email: string().email('El correo no es válido').required('El correo es requerido'),
  phone: string().required('El teléfono es requerido'),
  notes: string()
});

export const supplierSchema = object().shape({
  name: string().required('El nombre es requerido'),
  email: string().email('El correo no es válido').required('El correo es requerido'),
  phone: string().required('El teléfono es requerido'),
  address: string().required('La dirección es requerida'),
  city: string().required('El municipio es requerido'),
  state: string().required('El departamento es requerido'),
  country: string().required('El país es requerido'),
  notes: string(),
  contacts: array().of(contactSchema)
});

export const supplierUpdateSchema = object().shape({
  name: string().required('El nombre es requerido'),
  email: string().email('El correo no es válido').required('El correo es requerido'),
  phone: string().required('El teléfono es requerido'),
  address: string().required('La dirección es requerida'),
  city: string().required('El municipio es requerido'),
  state: string().required('El departamento es requerido'),
  country: string().required('El país es requerido'),
  notes: string()
});
