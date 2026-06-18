import { object, ref, string } from 'yup';

export const registerSchema = object().shape({
  name: string().required('El nombre es requerido'),
  email: string().email('El correo no es válido').required('El correo es requerido'),
  password: string().required('La contraseña es requerida'),
  password_confirm: string()
    .oneOf([ref('password')], 'Las contraseñas deben coincidir')
    .required('La confirmación de la contraseña es requerida')
});
