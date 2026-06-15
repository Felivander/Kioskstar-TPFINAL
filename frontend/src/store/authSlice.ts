import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import api from '../services/api';
import { User, AuthResponse, Branch } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  selectedBranch: Branch | null;
  loading: boolean;
  error: string | null;
  welcomeSplashActive: boolean;
}

const initialState: AuthState = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  selectedBranch: JSON.parse(localStorage.getItem('selectedBranch') || 'null'),
  loading: false,
  error: null,
  welcomeSplashActive: false,
};

export const loginUser = createAsyncThunk<AuthResponse, { email: string; password: string }>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', credentials);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } catch (error: any) {
      const errorData = error.response?.data;
      if (errorData?.details && Array.isArray(errorData.details)) {
        const detailMsg = errorData.details.map((d: any) => d.message).join('. ');
        return rejectWithValue(`${errorData.error}: ${detailMsg}`);
      }
      return rejectWithValue(errorData?.error || 'Error al iniciar sesión');
    }
  }
);

export const registerUser = createAsyncThunk<AuthResponse, { name: string; email: string; password: string }>(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/register', userData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } catch (error: any) {
      const errorData = error.response?.data;
      if (errorData?.details && Array.isArray(errorData.details)) {
        const detailMsg = errorData.details.map((d: any) => d.message).join('. ');
        return rejectWithValue(`${errorData.error}: ${detailMsg}`);
      }
      return rejectWithValue(errorData?.error || 'Error al registrarse');
    }
  }
);

export const onboardUser = createAsyncThunk<AuthResponse, any>(
  'auth/onboard',
  async (onboardData, { rejectWithValue }) => {
    try {
      const { data } = await api.post<AuthResponse>('/auth/onboard', onboardData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } catch (error: any) {
      const errorData = error.response?.data;
      if (errorData?.details && Array.isArray(errorData.details)) {
        const detailMsg = errorData.details.map((d: any) => d.message).join('. ');
        return rejectWithValue(`${errorData.error}: ${detailMsg}`);
      }
      return rejectWithValue(errorData?.error || 'Error en el onboarding');
    }
  }
);

export const joinKiosk = createAsyncThunk<AuthResponse & { branch?: Branch }, { code: string }>(
  'auth/joinKiosk',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await api.post<AuthResponse & { branch?: Branch }>('/auth/join-kiosk', payload);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.branch) {
        localStorage.setItem('selectedBranch', JSON.stringify(data.branch));
      }
      return data;
    } catch (error: any) {
      const errorData = error.response?.data;
      if (errorData?.details && Array.isArray(errorData.details)) {
        const detailMsg = errorData.details.map((d: any) => d.message).join('. ');
        return rejectWithValue(`${errorData.error}: ${detailMsg}`);
      }
      return rejectWithValue(errorData?.error || 'Código inválido');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.selectedBranch = null;
      state.error = null;
      state.welcomeSplashActive = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('selectedBranch');
    },
    clearError(state) {
      state.error = null;
    },
    updateAuthUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      localStorage.setItem('user', JSON.stringify(action.payload));
    },
    setSelectedBranch(state, action: PayloadAction<Branch | null>) {
      state.selectedBranch = action.payload;
      if (action.payload) {
        localStorage.setItem('selectedBranch', JSON.stringify(action.payload));
      } else {
        localStorage.removeItem('selectedBranch');
      }
    },
    finishSplash(state) {
      state.welcomeSplashActive = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.welcomeSplashActive = true;
        // Clear branch selection on new login to force re-selection
        state.selectedBranch = null;
        localStorage.removeItem('selectedBranch');
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(onboardUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(onboardUser.fulfilled, (state, action: PayloadAction<AuthResponse>) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(onboardUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(joinKiosk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(joinKiosk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        if (action.payload.branch) {
          state.selectedBranch = action.payload.branch;
        }
      })
      .addCase(joinKiosk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { logout, clearError, setSelectedBranch, updateAuthUser, finishSplash } = authSlice.actions;
export default authSlice.reducer;
