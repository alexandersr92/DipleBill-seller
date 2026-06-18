import { IInitialState } from '../types';

const initialSettings = [
  { id: '3', name: 'Facturacion', description: 'Configura la Facturacion de tienda' },
  { id: '1', name: 'Tienda', description: 'Configura los parametros de la tienda' },
  { id: '2', name: 'Usuarios', description: 'Configura los usuarios' },
  { id: '4', name: 'Vendedores', description: 'Administra tus vendedores' }
];

const initialState: IInitialState = {
  isLoading: false,
  error: null,
  settings: initialSettings,
  selectedSetting: initialSettings[0]
};

export default initialState;
