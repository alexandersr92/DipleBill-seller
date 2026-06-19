import { Routes, Route } from 'react-router-dom';
import routes from './routeList';
import Login from '../modules/auth/containers/Login';
import SellerLogin from '../modules/auth/containers/SellerLogin';
import Layout from '@/modules/layout';
import PrivateRoute from '../modules/auth/components/PrivateRoute';
import NotFound from '../modules/layout/404';
import Billing from '@/modules/billing/containers';
import InvoiceList from '@/modules/billing/containers/invoiceList';
import Invoice from '@/modules/billing/containers/invoice';

export const Router = () => {
  return (
    <Routes>
      {/* Home redirects to Billing in the seller application */}
      <Route
        path={routes.Home.path}
        element={
          <PrivateRoute>
            <Layout>
              <Billing />
            </Layout>
          </PrivateRoute>
        }
      />

      <Route path={routes.Login.path} element={<Login />} />
      <Route path={routes.SellerLogin.path} element={<SellerLogin />} />

      <Route
        path={routes.Venta.path}
        element={
          <PrivateRoute>
            <Layout>
              <Billing />
            </Layout>
          </PrivateRoute>
        }
      />

      <Route
        path={routes.InvoiceList.path}
        element={
          <PrivateRoute>
            <Layout>
              <InvoiceList />
            </Layout>
          </PrivateRoute>
        }
      />

      <Route
        path={routes.Invoice.path}
        element={
          <PrivateRoute>
            <Layout>
              <Invoice />
            </Layout>
          </PrivateRoute>
        }
      />

      <Route
        path="*"
        element={
          <PrivateRoute>
            <Layout>
              <NotFound />
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
};
