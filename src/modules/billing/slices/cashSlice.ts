import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '@/helpers/axiosInstance';

export interface ICashSession {
  id: string;
  store_id: string;
  user_id: string;
  cash_register_name: string | null;
  opening_balance: number;
  expected_balance: number;
  actual_cash: number;
  difference: number;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at: string | null;
  notes: string | null;
}

export interface ICashTotals {
  invoice_cash: number;
  invoice_transfer: number;
  invoice_card: number;
  credit_cash: number;
  credit_transfer: number;
  credit_card: number;
  manual_in: number;
  manual_out: number;
  expected_cash: number;
  total_transfer: number;
  total_card: number;
}

interface ICashState {
  activeSession: ICashSession | null;
  isOpen: boolean;
  totals: ICashTotals | null;
  controlMode: 'NONE' | 'SIMPLIFIED' | 'STRICT';
  assignmentMode: 'SHARED_STORE' | 'BY_STATION' | 'INDIVIDUAL_USER';
  countType: 'BLIND' | 'GUIDED';
  carryOver: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: ICashState = {
  activeSession: null,
  isOpen: false,
  totals: null,
  controlMode: 'NONE',
  assignmentMode: 'SHARED_STORE',
  countType: 'GUIDED',
  carryOver: false,
  isLoading: false,
  error: null
};

// Async Thunks
export const fetchCashSettingsAndSession = createAsyncThunk(
  'cash/fetchSettingsAndSession',
  async (storeId: string, { rejectWithValue }) => {
    try {
      // 1. Fetch active session details
      const sessionRes = await axiosInstance.get(`/v1/cash-sessions/active?store_id=${storeId}`);
      
      // 2. Fetch cash register settings policies (fallback to default policies if not configured)
      let controlMode: 'NONE' | 'SIMPLIFIED' | 'STRICT' = 'NONE';
      let assignmentMode: 'SHARED_STORE' | 'BY_STATION' | 'INDIVIDUAL_USER' = 'SHARED_STORE';
      let countType: 'BLIND' | 'GUIDED' = 'GUIDED';
      let carryOver = false;

      try {
        const modeRes = await axiosInstance.get('/v1/settings?key=cash_control_mode');
        const modeData = modeRes.data?.data || modeRes.data || [];
        if (modeData.length > 0) controlMode = modeData[0].value;
      } catch (e) {}

      try {
        const assignRes = await axiosInstance.get('/v1/settings?key=cash_assignment_mode');
        const assignData = assignRes.data?.data || assignRes.data || [];
        if (assignData.length > 0) assignmentMode = assignData[0].value;
      } catch (e) {}

      try {
        const countRes = await axiosInstance.get('/v1/settings?key=closing_count_type');
        const countData = countRes.data?.data || countRes.data || [];
        if (countData.length > 0) countType = countData[0].value;
      } catch (e) {}

      try {
        const carryRes = await axiosInstance.get('/v1/settings?key=carry_over_balance');
        const carryData = carryRes.data?.data || carryRes.data || [];
        if (carryData.length > 0) {
          carryOver = carryData[0].value === 'true' || carryData[0].value === true;
        }
      } catch (e) {}

      return {
        session: sessionRes.data?.session || null,
        isOpen: sessionRes.data?.is_open || false,
        totals: sessionRes.data?.totals || null,
        controlMode,
        assignmentMode,
        countType,
        carryOver
      };
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Error al cargar caja');
    }
  }
);

export const openCashSession = createAsyncThunk(
  'cash/openSession',
  async (
    payload: { storeId: string; openingBalance: number; cashRegisterName?: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post('/v1/cash-sessions/open', {
        store_id: payload.storeId,
        opening_balance: payload.openingBalance,
        cash_register_name: payload.cashRegisterName
      });
      // Store session ID in local storage
      if (response.data?.session?.id) {
        localStorage.setItem('active_cash_session_id', response.data.session.id);
      }
      // Refresh active session and totals
      dispatch(fetchCashSettingsAndSession(payload.storeId));
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Error al abrir caja');
    }
  }
);

export const closeCashSession = createAsyncThunk(
  'cash/closeSession',
  async (
    payload: { cashSessionId: string; actualCash: number; notes?: string; storeId: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post('/v1/cash-sessions/close', {
        cash_session_id: payload.cashSessionId,
        actual_cash: payload.actualCash,
        notes: payload.notes
      });
      // Remove session ID from local storage
      localStorage.removeItem('active_cash_session_id');
      // Refresh active session and totals
      dispatch(fetchCashSettingsAndSession(payload.storeId));
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Error al cerrar caja');
    }
  }
);

export const addCashTransaction = createAsyncThunk(
  'cash/addTransaction',
  async (
    payload: { cashSessionId: string; type: 'in' | 'out'; amount: number; description: string; storeId: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post('/v1/cash-sessions/transactions', {
        cash_session_id: payload.cashSessionId,
        type: payload.type,
        amount: payload.amount,
        description: payload.description
      });
      // Refresh active session and totals
      dispatch(fetchCashSettingsAndSession(payload.storeId));
      return response.data;
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.message || 'Error al registrar movimiento');
    }
  }
);

export const cashSlice = createSlice({
  name: 'cash',
  initialState,
  reducers: {
    clearCashState(state) {
      state.activeSession = null;
      state.isOpen = false;
      state.totals = null;
      state.error = null;
      localStorage.removeItem('active_cash_session_id');
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCashSettingsAndSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCashSettingsAndSession.fulfilled, (state, action: PayloadAction<any>) => {
        state.activeSession = action.payload.session;
        state.isOpen = action.payload.isOpen;
        state.totals = action.payload.totals;
        state.controlMode = action.payload.controlMode;
        state.assignmentMode = action.payload.assignmentMode;
        state.countType = action.payload.countType;
        state.carryOver = action.payload.carryOver;
        state.isLoading = false;
        state.error = null;

        if (action.payload.session?.id) {
          localStorage.setItem('active_cash_session_id', action.payload.session.id);
        } else {
          localStorage.removeItem('active_cash_session_id');
        }
      })
      .addCase(fetchCashSettingsAndSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(openCashSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(openCashSession.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(openCashSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(closeCashSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(closeCashSession.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(closeCashSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearCashState } = cashSlice.actions;
export default cashSlice.reducer;
