import { useState, useEffect } from 'react';
import { validateToken } from '../services/authService';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { setUser } from '../slices/userSlice';
import { IUserState } from '../slices/user.types';
import { getStoredToken } from '@/helpers/authSession';
import { fetchCurrentStore, fetchStores } from '@/modules/stores/slices/storeThunks';
import { hydrateFromCache } from '@/modules/stores/slices/storeSlice';
import { getMetadata, metadataKeys } from '@/modules/offline/db';
import { setBootedFromCache } from '@/modules/offline/slices/offlineSlice';
import { IAuthSnapshot } from '@/modules/offline/types';

export type ValidationState = boolean | null | 'offline-blocked';

export function useValidateToken(): ValidationState {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.userSlice);
  const token = getStoredToken();
  const [isValidated, setIsValidated] = useState<ValidationState>(null);

  useEffect(() => {
    // Sin red: arrancar con el snapshot de sesión cacheado (si el token coincide).
    async function validateFromCache(): Promise<boolean> {
      try {
        const snapshot = await getMetadata<IAuthSnapshot>(metadataKeys.authSnapshot);
        if (!snapshot || snapshot.token !== token) return false;

        dispatch(setUser({ ...snapshot.user, token: token! }));
        dispatch(
          hydrateFromCache({ stores: snapshot.stores ?? [], store: snapshot.currentStore ?? null })
        );
        dispatch(setBootedFromCache(true));
        return true;
      } catch {
        return false;
      }
    }

    async function validate() {
      if (token) {
        if (isAuthenticated) {
          setIsValidated(true);
          return true;
        }

        const validUser = await validateToken(token);

        if (!validUser.valid && validUser.networkError) {
          const restored = await validateFromCache();
          setIsValidated(restored ? true : 'offline-blocked');
          return restored;
        }

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
            isSellerAuthenticated: hasSeller,
            mustChangePassword: (validUser.user as any).must_change_password || false,
            avatar: (validUser.user as any).avatar || '',
            googleId: (validUser.user as any).google_id || '',
            name: validUser.user.name || ''
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
