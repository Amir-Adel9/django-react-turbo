import { useCallback } from 'react';
import {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useLazyRefreshQuery,
} from '@/shared/api/auth.api';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setUser } from '@/store/authSlice';
import type { User } from '@/shared/api/api.types';

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    name: string,
    password: string,
    password_confirm: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
}

export function useAuth(): UseAuthReturn {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((s) => s.auth);
  const [loginMutation] = useLoginMutation();
  const [registerMutation] = useRegisterMutation();
  const [logoutMutation] = useLogoutMutation();
  const [triggerRefresh] = useLazyRefreshQuery();

  const refresh = useCallback(async (): Promise<boolean> => {
    const result = await triggerRefresh();
    if (result.isError || !result.data) {
      dispatch(setUser(null));
      return false;
    }
    return true;
  }, [triggerRefresh, dispatch]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await loginMutation({ email, password }).unwrap();
      dispatch(setUser(res.user));
    },
    [loginMutation, dispatch],
  );

  const register = useCallback(
    async (
      email: string,
      name: string,
      password: string,
      password_confirm: string,
    ) => {
      await registerMutation({
        email,
        name,
        password,
        password_confirm,
      }).unwrap();
    },
    [registerMutation],
  );

  const logout = useCallback(async () => {
    await logoutMutation()
      .unwrap()
      .catch(() => {});
    dispatch(setUser(null));
  }, [logoutMutation, dispatch]);

  return {
    user,
    loading,
    login,
    register,
    logout,
    refresh,
  };
}
