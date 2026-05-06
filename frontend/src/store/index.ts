import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import kioskReducer from './kioskSlice';
import stockReducer from './stockSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    kiosks: kioskReducer,
    stock: stockReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
