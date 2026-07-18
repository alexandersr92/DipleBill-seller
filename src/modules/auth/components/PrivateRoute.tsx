import { Navigate } from 'react-router';
import { useValidateToken } from '../hooks/useValidateToken';
import LayoutSkeleton from './LayoutSkeleton';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { PinLockOverlay } from '@/modules/billing/components/PinLockOverlay';
import { CashSessionOverlay } from '@/modules/billing/components/CashSessionOverlay';
import { fetchCashSettingsAndSession, openCashSession } from '@/modules/billing/slices/cashSlice';
import { useEffect } from 'react';
import { MustChangePasswordOverlay } from './MustChangePasswordOverlay';
import { OfflineBlockedScreen } from '@/modules/offline/components/OfflineBlockedScreen';
import { useOnlineStatus } from '@/modules/offline/hooks/useOnlineStatus';

interface IPrivateRouteProps {
  children: JSX.Element;
}

export default function PrivateRoute({ children }: IPrivateRouteProps) {
  const dispatch = useAppDispatch();
  const isValidated = useValidateToken();
  const isOnline = useOnlineStatus();

  const { store } = useAppSelector((state) => state.storeSlice);
  const storeId = store?.id || '';

  const { isSellerAuthenticated, mustChangePassword } = useAppSelector((state) => state.userSlice);

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

  useEffect(() => {
    // La auto-apertura SIMPLIFIED requiere red: offline no se abre caja (regla de negocio).
    if (isSellerAuthenticated && storeId && !isCashLoading && isOnline) {
      if (controlMode === 'SIMPLIFIED' && !isOpen) {
        dispatch(openCashSession({ storeId, openingBalance: 0, cashRegisterName: 'Caja Simplificada' }));
      }
    }
  }, [isSellerAuthenticated, storeId, controlMode, isOpen, isCashLoading, isOnline, dispatch]);

  if (isValidated === null) {
    return <LayoutSkeleton />;
  }

  if (isValidated === 'offline-blocked') {
    return <OfflineBlockedScreen />;
  }

  if (!isValidated) {
    return <Navigate to="/login" />;
  }

  if (mustChangePassword) {
    return <MustChangePasswordOverlay />;
  }

  if (!isSellerAuthenticated) {
    // El login de vendedor (PIN) se valida contra el servidor: offline no es posible.
    if (!isOnline) {
      return (
        <OfflineBlockedScreen message="Se requiere conexión a internet para iniciar la sesión del vendedor. Solo se puede facturar offline con una sesión ya iniciada." />
      );
    }
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
