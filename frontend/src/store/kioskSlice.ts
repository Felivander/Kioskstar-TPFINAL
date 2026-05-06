import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../services/api';
import { Kiosk, Branch } from '../types';

interface KioskState {
  kiosks: Kiosk[];
  branches: Branch[];
  loading: boolean;
  error: string | null;
}

const initialState: KioskState = {
  kiosks: [],
  branches: [],
  loading: false,
  error: null,
};

export const fetchKiosks = createAsyncThunk<Kiosk[]>('kiosks/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get<Kiosk[]>('/kiosks');
    return data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || 'Error al cargar kioscos');
  }
});

export const fetchBranches = createAsyncThunk<Branch[], number>('kiosks/fetchBranches', async (kioskId, { rejectWithValue }) => {
  try {
    const { data } = await api.get<Branch[]>(`/kiosks/${kioskId}/branches`);
    return data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || 'Error al cargar sucursales');
  }
});

const kioskSlice = createSlice({
  name: 'kiosks',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchKiosks.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchKiosks.fulfilled, (state, action: PayloadAction<Kiosk[]>) => {
        state.loading = false;
        state.kiosks = action.payload;
      })
      .addCase(fetchKiosks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchBranches.pending, (state) => { state.loading = true; })
      .addCase(fetchBranches.fulfilled, (state, action: PayloadAction<Branch[]>) => {
        state.loading = false;
        state.branches = action.payload;
      })
      .addCase(fetchBranches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default kioskSlice.reducer;
