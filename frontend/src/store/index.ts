import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import kioskReducer from './kioskSlice';
import stockReducer from './stockSlice';
import cashSessionReducer from './cashSessionSlice';

const appReducer = combineReducers({
  auth: authReducer,
  kiosks: kioskReducer,
  stock: stockReducer,
  cashSessions: cashSessionReducer,
});

const rootReducer = (state: any, action: any) => {
  if (action.type === 'auth/logout') {
    state = undefined;
  }
  return appReducer(state, action);
};

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
