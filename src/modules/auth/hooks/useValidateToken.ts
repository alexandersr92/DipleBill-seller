import { useState, useEffect } from 'react';
import { validateToken } from '../services/authService';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setUser } from '../slices/userSlice';
import { IUserState } from '../slices/user.types';
import { getStoredToken } from '@/helpers/authSession';
import { fetchCurrentStore, fetchStores } from '@/modules/stores/slices/storeThunks';

export function useValidateToken() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.userSlice);
  const token = getStoredToken();
  const [isValidated, setIsValidated] = useState<boolean | null>(null);

  useEffect(() => {
    async function validate() {
      if (token) {
        if (isAuthenticated) {
          setIsValidated(true);
          return true;
        }

        const validUser = await validateToken(token);
        setIsValidated(validUser.valid);

        if (validUser.valid) {
          const storedSellerId = localStorage.getItem('seller_id') || '';
          const storedSellerName = localStorage.getItem('seller_name') || '';
          const storedSellerCode = localStorage.getItem('seller_code') || '';
          const hasSeller = !!storedSellerId;

          const user: IUserState = {
            token,
            email: validUser.user.email,
            isAuthenticated: true,
            id: validUser.user.id,
            orgId: validUser.user.organization_id,
            sellerId: storedSellerId || validUser.user.seller_id || '',
            sellerName: storedSellerName,
            sellerCode: storedSellerCode,
            isSellerAuthenticated: hasSeller
          };

          dispatch(setUser(user));

          // Fetch all stores first
          const storesResult = await dispatch(fetchStores()).unwrap();

          const savedStoreId = localStorage.getItem('currentStoreId');
          let currentStoreId = savedStoreId;
          if (!currentStoreId && storesResult && storesResult.length > 0) {
            // Si solo tiene 1 sucursal, la seleccionamos por defecto.
            // Si tiene múltiples, dejamos que el usuario la seleccione en el Lock screen.
            if (storesResult.length === 1) {
              const firstStoreId = storesResult[0].id;
              localStorage.setItem('currentStoreId', firstStoreId);
              currentStoreId = firstStoreId;
            }
          }

          const storeIdToFetch = currentStoreId || '';
          if (storeIdToFetch) {
            dispatch(fetchCurrentStore(storeIdToFetch));
          }
        }
      } else {
        setIsValidated(false);
      }
    }

    validate();
  }, [dispatch, isAuthenticated, token]);

  return isValidated;
}
