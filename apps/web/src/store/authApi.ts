import type {
  LoginBody,
  LoginResponse,
  RegisterBody,
  User,
} from "@/api/types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: "",
  credentials: "include",
  prepareHeaders: (headers) => {
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery,
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginBody>({
      query: (body) => ({
        url: "/api/auth/login/",
        method: "POST",
        body,
      }),
      transformResponse: (response: LoginResponse) => response,
    }),
    register: builder.mutation<{ message?: string }, RegisterBody>({
      query: (body) => ({
        url: "/api/auth/register/",
        method: "POST",
        body,
      }),
    }),
    refresh: builder.query<{ ok?: boolean }, void>({
      query: () => ({
        url: "/api/auth/refresh/",
        method: "POST",
      }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/api/auth/logout/",
        method: "POST",
      }),
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
