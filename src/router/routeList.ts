type route = {
  [key: string]: {
    path: string;
    name: string;
  };
};

const routes: route = {
  Home: {
    path: '/',
    name: 'Inicio'
  },
  Login: {
    path: '/login',
    name: 'Login'
  },
  Venta: {
    path: '/venta',
    name: 'Venta'
  },
  InvoiceList: {
    path: '/invoices',
    name: 'Facturas'
  },
  Invoice: {
    path: '/invoices/:id',
    name: 'Facturas'
  },
  Credits: {
    path: '/credits',
    name: 'Creditos'
  },
  CashControl: {
    name: 'Control de Caja',
    path: '/caja'
  }
};

export default routes;
