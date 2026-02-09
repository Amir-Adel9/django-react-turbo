import { configureStore } from '@reduxjs/toolkit';
import { authApi } from '@/shared/api/auth.api';
import { tasksApi } from '@/shared/api/tasks.api';
import { authSlice } from './authSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    [authApi.reducerPath]: authApi.reducer,
    [tasksApi.reducerPath]: tasksApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware, tasksApi.middleware),
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
