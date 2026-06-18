import { object, string } from 'yup';

export const InventorySchema = object().shape({
  name: string()
  .matches(/^[a-zA-Z0-9,-.ÁÉÍÓÚáéíóúÑñ0\s]*$/, 'Los carácteres especiales no son permitidos!')
  .min(6, 'Nombre demasiado corto!')
  .required('El nombre es requerido!'),
  address: string()
  .matches(/^[a-zA-Z0-9,-.ÁÉÍÓÚáéíóúÑñ0\s]*$/, 'Los carácteres especiales no son permitidos!')
  .min(6, 'Dirección demasiada corta!')
  .required('La dirección es requerida!'),
  description: string()
  .matches(/^[a-zA-Z0-9,-.ÁÉÍÓÚáéíóúÑñ0\s]*$/, 'Los carácteres especiales no son permitidos!')
  .min(6, 'Descripción demasiada corta!')
  .required('La descripción es requerida!')
});
