import { configureStore } from '@reduxjs/toolkit';
import { authApi } from '@/shared/api/auth.api';
import { authSlice } from './authSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    [authApi.reducerPath]: authApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
