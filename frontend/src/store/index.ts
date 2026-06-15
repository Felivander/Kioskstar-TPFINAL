import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import kioskReducer from './kioskSlice';
import stockReducer from './stockSlice';
import cashSessionReducer from './cashSessionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    kiosks: kioskReducer,
    stock: stockReducer,
    cashSessions: cashSessionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
