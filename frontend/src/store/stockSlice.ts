import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../services/api';
import { StockItem } from '../types';

interface StockState {
  items: StockItem[];
  loading: boolean;
  error: string | null;
}

const initialState: StockState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchStock = createAsyncThunk<StockItem[], number>('stock/fetchByBranch', async (branchId, { rejectWithValue }) => {
  try {
    const { data } = await api.get<StockItem[]>(`/branches/${branchId}/stock`);
    return data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || 'Error al cargar stock');
  }
});

const stockSlice = createSlice({
  name: 'stock',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchStock.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchStock.fulfilled, (state, action: PayloadAction<StockItem[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchStock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default stockSlice.reducer;
