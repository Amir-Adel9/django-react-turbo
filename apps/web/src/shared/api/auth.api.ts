import type {
  LoginBody,
  LoginResponse,
  RegisterBody,
  RegisterResponse,
  User,
} from '@/shared/api/api.types';
import { getApiBaseUrl, fetchWithAuth } from '@/shared/api/http-client';
import { createApi } from '@reduxjs/toolkit/query/react';

function authUrl(path: string): string {
  const base = getApiBaseUrl();
  return `${base ? base.replace(/\/$/, '') : ''}${path}`;
}

/**
 * Auth API via fetch (credentials: include) so path types are not tied to
 * openapi-fetch. RTK Query provides hooks and cache.
 */
export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: () => ({ data: undefined }),
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginBody>({
      queryFn: async (body) => {
        try {
          const res = await fetchWithAuth(authUrl('/api/auth/login'), {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) return { error: { status: res.status, data } };
          return { data: data as LoginResponse };
        } catch (err) {
          return {
            error: {
              status: 'CUSTOM_ERROR' as const,
              error: String(err),
              data: err,
            },
          };
        }
      },
    }),
    register: builder.mutation<RegisterResponse, RegisterBody>({
      queryFn: async (body) => {
        try {
          const res = await fetchWithAuth(authUrl('/api/auth/register'), {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) return { error: { status: res.status, data } };
          return { data: data as RegisterResponse };
        } catch (err) {
          return {
            error: {
              status: 'CUSTOM_ERROR' as const,
              error: String(err),
              data: err,
            },
          };
        }
      },
    }),
    refresh: builder.query<{ ok?: boolean }, void>({
      queryFn: async () => {
        try {
          const res = await fetchWithAuth(authUrl('/api/auth/refresh'), {
            method: 'POST',
            credentials: 'include',
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) return { error: { status: res.status, data } };
          return { data: data as { ok?: boolean } };
        } catch (err) {
          return {
            error: {
              status: 'CUSTOM_ERROR' as const,
              error: String(err),
              data: err,
            },
          };
        }
      },
    }),
    logout: builder.mutation<void, void>({
      queryFn: async () => {
        try {
          const res = await fetchWithAuth(authUrl('/api/auth/logout'), {
            method: 'POST',
            credentials: 'include',
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            return { error: { status: res.status, data } };
          }
          return { data: undefined };
        } catch (err) {
          return {
            error: {
              status: 'CUSTOM_ERROR' as const,
              error: String(err),
              data: err,
            },
          };
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLazyRefreshQuery,
  useLogoutMutation,
} = authApi;

export type { LoginResponse, User };
