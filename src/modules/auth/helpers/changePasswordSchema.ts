import { object, string, ref } from 'yup';

export const changePasswordSchema = object().shape({
  current_password: string().required('La contraseña actual es requerida'),
  password: string()
    .required('La nueva contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  password_confirmation: string()
    .required('Debes confirmar la nueva contraseña')
    .oneOf([ref('password')], 'Las contraseñas no coinciden'),
});
