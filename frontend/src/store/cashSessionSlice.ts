import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export interface UserSummary {
  id: number;
  name: string;
}

export interface SaleItemSummary {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  product: {
    id: number;
    name: string;
    price: number;
  };
}

export interface PaymentSummary {
  method: string;
  amount: number;
}

export interface SaleSummary {
  id: number;
  total: number;
  paymentMethod: string;
  payments: PaymentSummary[] | null;
  createdAt: string;
  user: UserSummary;
  items: SaleItemSummary[];
}

export interface CashSession {
  id: number;
  branchId: number;
  openedById: number;
  closedById: number | null;
  status: 'OPEN' | 'CLOSED';
  openingBalance: number;
  expectedBalance: number | null;
  currentExpectedBalance?: number | null;
  actualBalance: number | null;
  cashCount: Record<string, number> | null;
  notes: string | null;
  openedAt: string;
  closedAt: string | null;
  openedBy: UserSummary;
  closedBy?: UserSummary | null;
  sales?: SaleSummary[];
}

interface CashSessionState {
  activeSession: CashSession | null;
  history: CashSession[];
  loading: boolean;
  error: string | null;
}

const initialState: CashSessionState = {
  activeSession: null,
  history: [],
  loading: false,
  error: null,
};

export const fetchActiveSession = createAsyncThunk<CashSession | null, number>(
  'cashSessions/fetchActive',
  async (branchId, { rejectWithValue }) => {
    try {
      const { data } = await api.get<CashSession | null>(`/cash-sessions/active/${branchId}`);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al obtener caja activa');
    }
  }
);

export const openCashSession = createAsyncThunk<CashSession, { branchId: number; openingBalance: number }>(
  'cashSessions/open',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post<CashSession>('/cash-sessions/open', payload);
      return data;
    } catch (error: any) {
      const errorData = error.response?.data;
      if (errorData?.details && Array.isArray(errorData.details)) {
        const detailMsg = errorData.details.map((d: any) => d.message).join('. ');
        return rejectWithValue(`${errorData.error}: ${detailMsg}`);
      }
      return rejectWithValue(errorData?.error || 'Error al abrir caja');
    }
  }
);

export const closeCashSession = createAsyncThunk<CashSession, { sessionId: number; actualBalance: number; notes?: string; cashCount?: Record<string, number> }>(
  'cashSessions/close',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post<CashSession>('/cash-sessions/close', payload);
      return data;
    } catch (error: any) {
      const errorData = error.response?.data;
      if (errorData?.details && Array.isArray(errorData.details)) {
        const detailMsg = errorData.details.map((d: any) => d.message).join('. ');
        return rejectWithValue(`${errorData.error}: ${detailMsg}`);
      }
      return rejectWithValue(errorData?.error || 'Error al cerrar caja');
    }
  }
);

export const fetchSessionHistory = createAsyncThunk<CashSession[], number>(
  'cashSessions/fetchHistory',
  async (branchId, { rejectWithValue }) => {
    try {
      const { data } = await api.get<CashSession[]>(`/cash-sessions/branch/${branchId}`);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Error al obtener historial');
    }
  }
);

const cashSessionSlice = createSlice({
  name: 'cashSessions',
  initialState,
  reducers: {
    clearSessionError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Active
      .addCase(fetchActiveSession.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchActiveSession.fulfilled, (state, action) => {
        state.loading = false;
        state.activeSession = action.payload;
      })
      .addCase(fetchActiveSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Open
      .addCase(openCashSession.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(openCashSession.fulfilled, (state, action) => {
        state.loading = false;
        state.activeSession = action.payload;
      })
      .addCase(openCashSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Close
      .addCase(closeCashSession.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(closeCashSession.fulfilled, (state) => {
        state.loading = false;
        state.activeSession = null;
      })
      .addCase(closeCashSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch History
      .addCase(fetchSessionHistory.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchSessionHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
      })
      .addCase(fetchSessionHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearSessionError } = cashSessionSlice.actions;
export default cashSessionSlice.reducer;
