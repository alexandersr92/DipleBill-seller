import { Navigate } from 'react-router';
import { useValidateToken } from '../hooks/useValidateToken';
import LayoutSkeleton from './LayoutSkeleton';
import { useAppSelector } from '@/store/hooks';

interface IPrivateRouteProps {
  children: JSX.Element;
}

export default function PrivateRoute({ children }: IPrivateRouteProps) {
  const isValidated = useValidateToken();
  const isSellerAuthenticated = useAppSelector((state) => state.userSlice.isSellerAuthenticated);

  if (isValidated === null) {
    return <LayoutSkeleton />;
  }

  if (!isValidated) {
    return <Navigate to="/login" />;
  }

  if (!isSellerAuthenticated) {
    return <Navigate to="/seller-login" />;
  }

  return children;
}
