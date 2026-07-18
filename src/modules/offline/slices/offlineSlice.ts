import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface IOfflineState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  errorCount: number;
  lastSyncAt: string | null;
  bootedFromCache: boolean;
}

const initialState: IOfflineState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingCount: 0,
  errorCount: 0,
  lastSyncAt: null,
  bootedFromCache: false
};

export const offlineSlice = createSlice({
  name: 'offlineSlice',
  initialState,
  reducers: {
    setOnline: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    setCounts: (state, action: PayloadAction<{ pending: number; errors: number }>) => {
      state.pendingCount = action.payload.pending;
      state.errorCount = action.payload.errors;
    },
    setLastSyncAt: (state, action: PayloadAction<string | null>) => {
      state.lastSyncAt = action.payload;
    },
    setBootedFromCache: (state, action: PayloadAction<boolean>) => {
      state.bootedFromCache = action.payload;
    }
  }
});

export const { setOnline, setSyncing, setCounts, setLastSyncAt, setBootedFromCache } =
  offlineSlice.actions;
