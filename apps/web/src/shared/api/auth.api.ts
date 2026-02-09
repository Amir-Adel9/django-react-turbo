import type {
  LoginBody,
  LoginResponse,
  RegisterBody,
  RegisterResponse,
  User,
} from '@/shared/api/api.types';
import { apiClient } from '@/shared/api/http-client';
import { createApi } from '@reduxjs/toolkit/query/react';

/**
 * Type-safe auth API: all calls go through openapi-fetch client so path and
 * body types are enforced by the schema. RTK Query provides hooks and cache.
 */
export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: () => ({ data: undefined }), // unused; we use queryFn for every endpoint
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginBody>({
      queryFn: async (body) => {
        try {
          const result = await apiClient.POST('/api/auth/login', { body });
          const { response } = result;
          if (!response.ok) {
            const data = 'error' in result ? result.error : undefined;
            return {
              error: {
                status: response.status,
                data: data ?? (await response.clone().json().catch(() => ({}))),
              },
            };
          }
          // Schema marks 200 as no content; backend actually returns { user }
          const out =
            'data' in result && result.data !== undefined
              ? result.data
              : (await response.json().catch(() => ({}))) as LoginResponse;
          return { data: out as LoginResponse };
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
          const result = await apiClient.POST('/api/auth/register', { body });
          const { response } = result;
          if (!response.ok) {
            const data = 'error' in result ? result.error : undefined;
            return {
              error: {
                status: response.status,
                data: data ?? (await response.clone().json().catch(() => ({}))),
              },
            };
          }
          // 201: schema has Register; backend returns { message }
          const raw =
            'data' in result && result.data !== undefined
              ? result.data
              : await response.json().catch(() => ({}));
          return { data: raw as RegisterResponse };
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
          const result = await apiClient.POST('/api/auth/refresh');
          const { response } = result;
          if (!response.ok) {
            const data = 'error' in result ? result.error : undefined;
            return {
              error: {
                status: response.status,
                data: data ?? (await response.clone().json().catch(() => ({}))),
              },
            };
          }
          const out =
            'data' in result && result.data !== undefined
              ? result.data
              : (await response.json().catch(() => ({}))) as { ok?: boolean };
          return { data: out };
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
          const result = await apiClient.POST('/api/auth/logout');
          const { response } = result;
          if (!response.ok) {
            const data = 'error' in result ? result.error : undefined;
            return {
              error: {
                status: response.status,
                data: data ?? (await response.clone().json().catch(() => ({}))),
              },
            };
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
