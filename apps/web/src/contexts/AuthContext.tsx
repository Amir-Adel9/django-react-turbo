import {
  useLazyRefreshQuery,
  useLoginMutation,
  useLogoutMutation,
  useRegisterMutation,
} from "@/store/authApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setLoading, setUser } from "@/store/authSlice";
import type { User } from "@/api/types";
import {
  useCallback,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { createContext } from "react";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    name: string,
    password: string,
    password_confirm: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
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
    [loginMutation, dispatch]
  );

  const register = useCallback(
    async (
      email: string,
      name: string,
      password: string,
      password_confirm: string
    ) => {
      await registerMutation({ email, name, password, password_confirm }).unwrap();
      await login(email, password);
    },
    [registerMutation, login]
  );

  const logout = useCallback(async () => {
    await logoutMutation().unwrap().catch(() => {});
    dispatch(setUser(null));
  }, [logoutMutation, dispatch]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refresh();
      if (!cancelled) dispatch(setLoading(false));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    login,
    register,
    logout,
    refresh,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx == null) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
