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
  SellerLogin: {
    path: '/seller-login',
    name: 'Acceso Vendedor'
  },
  Register: {
    path: '/register',
    name: 'Registro'
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
  Organization: {
    path: '/organization',
    name: 'Organización'
  },
  Credits: {
    path: '/credits',
    name: 'Creditos'
  },
  PaidCredits: {
    path: '/paid-credits',
    name: 'Créditos Pagados'
  },
  Credit: {
    path: '/credits/:id',
    name: 'Credito'
  },
  PaidCredit: {
    path: '/paid-credits/:id',
    name: 'Crédito Pagado'
  },
  Proveedores: {
    path: '/proveedores',
    name: 'Proveedores'
  },
  Clients: {
    path: '/clients',
    name: 'Clientes'
  },
  Productos: {
    path: '/products',
    name: 'Productos'
  },
  Inventories: {
    path: '/inventories',
    name: 'Inventarios'
  },
  Inventory: {
    path: '/inventories/:id',
    name: 'Inventarios'
  },
  InventoryNewProduct: {
    path: '/inventories/:id/new-product',
    name: 'Nuevo producto en Inventario'
  },
  EditInventoryProduct: {
    path: '/inventories/:id/edit-product/:productId',
    name: 'Editar Producto en Inventario'
  },
  NewProduct: {
    path: '/products/new',
    name: 'Nuevo Producto'
  },
  EditProduct: {
    path: '/products/edit/:id',
    name: 'Editar Producto'
  },
  Compra: {
    path: '/compra',
    name: 'Compra'
  },
  Compras: {
    path: '/compras',
    name: 'Compras'
  },
  compraItem: {
    path: '/compras/:id',
    name: 'Compra'
  },
  Settings: {
    name: 'Configuraciones',
    path: '/configuracion'
  },
  Setting: {
    name: 'Configuración',
    path: '/configuracion/:id'
  },
  Reports: {
    name: 'Reportes',
    path: '/reports'
  }
};

export default routes;
