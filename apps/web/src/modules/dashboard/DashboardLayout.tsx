import { useEffect } from 'react';
import { useLoaderData } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/authSlice';
import type { User } from '@/shared/api/api.types';
import { DashboardPage } from './DashboardPage';

export interface DashboardLoaderData {
  user: User;
}

/**
 * Layout for protected routes. Syncs loader user to Redux so useAuth() and
 * the rest of the app see the same auth state, then renders the dashboard.
 */
export function DashboardLayout() {
  const { user } = useLoaderData() as DashboardLoaderData;
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setUser(user));
  }, [user, dispatch]);

  return <DashboardPage />;
}
