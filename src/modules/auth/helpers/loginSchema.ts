import { object, string } from 'yup';

export const loginSchema = object().shape({
  email: string().email().required('El Correo es Requerido'),
  password: string().required('La Contraseña es Requerida')
});
