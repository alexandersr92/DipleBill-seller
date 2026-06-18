import { configureStore, combineReducers, createAction, PayloadAction } from '@reduxjs/toolkit';
import { userSlice, userLogout } from '../modules/auth/slices/userSlice';
import { clientSlice } from '@/modules/clients/slices/clientSlice';
import { storeSlice } from '../modules/stores/slices/storeSlice';
import { supplierSlice } from '@/modules/supplier/slices/supplierSlice';
import { contactSlice } from '@/modules/supplier/slices/contactSlice';
import { inventorySlice } from '@/modules/inventory/slices/inventorySlice';
import { billingSlice } from '@/modules/billing/slices/billingSlice';
import { productSlice } from '../modules/product/slices/ProductSlice';
import { purchaseSlice } from '../modules/compras/slices/purchaseSlice';
import { settingSlice } from '../modules/settings/slices/settingSlice';
import { creditsSlice } from '@/modules/credits/slices/creditsSlice';
import { reportsSlice } from '@/modules/reports/slices/reportsSlice';

const appReducer = combineReducers({
  userSlice: userSlice.reducer,
  clientSlice: clientSlice.reducer,
  storeSlice: storeSlice.reducer,
  supplierSlice: supplierSlice.reducer,
  contactSlice: contactSlice.reducer,
  inventorySlice: inventorySlice.reducer,
  billingSlice: billingSlice.reducer,
  productSlice: productSlice.reducer,
  puchaseSlice: purchaseSlice.reducer,
  settingSlice: settingSlice.reducer,
  creditsSlice: creditsSlice.reducer,
  reportsSlice: reportsSlice.reducer
});

export const resetAppState = createAction('app/resetAll');

const rootReducer = (
  state: ReturnType<typeof appReducer> | undefined,
  action: PayloadAction<any>
) => {
  if (action.type === userLogout.type) {
    state = undefined;
  }
  if (action.type === resetAppState.type) {
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const restartReduxState = () => store.dispatch(resetAppState());
