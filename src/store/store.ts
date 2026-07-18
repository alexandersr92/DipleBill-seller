import { configureStore, combineReducers, createAction, PayloadAction } from '@reduxjs/toolkit';
import { userSlice, userLogout } from '../modules/auth/slices/userSlice';
import { clientSlice } from '@/modules/clients/slices/clientSlice';
import { storeSlice } from '../modules/stores/slices/storeSlice';
import { billingSlice } from '@/modules/billing/slices/billingSlice';
import { cashSlice } from '@/modules/billing/slices/cashSlice';
import { offlineSlice } from '@/modules/offline/slices/offlineSlice';

const appReducer = combineReducers({
  userSlice: userSlice.reducer,
  clientSlice: clientSlice.reducer,
  storeSlice: storeSlice.reducer,
  billingSlice: billingSlice.reducer,
  cashSlice: cashSlice.reducer,
  offlineSlice: offlineSlice.reducer
});

export const resetAppState = createAction('app/resetAll');

const rootReducer = (
  state: ReturnType<typeof appReducer> | undefined,
  action: PayloadAction<any>
) => {
  // El estado de conectividad/sync sobrevive al logout: la cola offline sigue
  // existiendo en IndexedDB y el detector de red no debe reiniciarse.
  if (action.type === userLogout.type || action.type === resetAppState.type) {
    state = state ? ({ offlineSlice: state.offlineSlice } as typeof state) : undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const restartReduxState = () => store.dispatch(resetAppState());
