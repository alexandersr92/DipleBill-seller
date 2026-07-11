import { Navigate } from 'react-router';
import { useValidateToken } from '../hooks/useValidateToken';
import LayoutSkeleton from './LayoutSkeleton';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { PinLockOverlay } from '@/modules/billing/components/PinLockOverlay';
import { CashSessionOverlay } from '@/modules/billing/components/CashSessionOverlay';
import { fetchCashSettingsAndSession } from '@/modules/billing/slices/cashSlice';
import { useEffect } from 'react';

interface IPrivateRouteProps {
  children: JSX.Element;
}

export default function PrivateRoute({ children }: IPrivateRouteProps) {
  const dispatch = useAppDispatch();
  const isValidated = useValidateToken();

  const { store } = useAppSelector((state) => state.storeSlice);
  const storeId = store?.id || '';

  const { isSellerAuthenticated } = useAppSelector((state) => state.userSlice);

  const {
    isOpen,
    controlMode,
    isLoading: isCashLoading
  } = useAppSelector((state) => state.cashSlice);

  useEffect(() => {
    if (isSellerAuthenticated && storeId) {
      dispatch(fetchCashSettingsAndSession(storeId));
    }
  }, [isSellerAuthenticated, storeId, dispatch]);

  if (isValidated === null) {
    return <LayoutSkeleton />;
  }

  if (!isValidated) {
    return <Navigate to="/login" />;
  }

  if (!isSellerAuthenticated) {
    return <PinLockOverlay />;
  }

  // Si controlMode es STRICT y la caja no está abierta, bloquear con la pantalla de apertura
  if (controlMode === 'STRICT' && !isOpen) {
    if (isCashLoading && !storeId) {
      return <LayoutSkeleton />;
    }
    return <CashSessionOverlay />;
  }

  return children;
}
