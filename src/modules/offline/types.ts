import { IUserState } from '@/modules/auth/slices/user.types';
import { ICurrentStore, IStore } from '@/modules/stores/slices/store.types';
import { ICashSession } from '@/modules/billing/slices/cashSlice';

// Snapshot de sesión guardado en Dexie para arrancar la app sin conexión.
export interface IAuthSnapshot {
  token: string;
  user: IUserState;
  stores: IStore[];
  currentStore: ICurrentStore | null;
  cachedAt: string;
}

// Snapshot del estado de caja (fetchCashSettingsAndSession) para operar offline.
export interface ICashSnapshot {
  session: ICashSession | null;
  isOpen: boolean;
  totals: unknown;
  controlMode: 'NONE' | 'SIMPLIFIED' | 'STRICT';
  assignmentMode: 'SHARED_STORE' | 'BY_STATION' | 'INDIVIDUAL_USER';
  countType: 'BLIND' | 'GUIDED';
  carryOver: boolean;
  cachedAt: string;
}
