import createClient from 'openapi-fetch';
import type { paths } from '@digisay/api-contract';

const AUTH_LOGIN = '/api/auth/login';
const AUTH_REFRESH = '/api/auth/refresh';
const AUTH_REGISTER = '/api/auth/register';
const AUTH_ME = '/api/auth/me';

const AUTH_PATHS = new Set([AUTH_LOGIN, AUTH_REFRESH, AUTH_REGISTER, AUTH_ME]);

function isAuthPath(url: string): boolean {
  try {
    const path = new URL(url, 'http://localhost').pathname;
    return AUTH_PATHS.has(path);
  } catch {
    return false;
  }
}

/**
 * Base URL: same origin so /api/* hits Vite proxy to Django (localhost:8000).
 * All requests use credentials: 'include' for HttpOnly cookies.
 */
const API_BASE =
  typeof window !== 'undefined'
    ? ''
    : (import.meta.env?.VITE_API_BASE_URL ?? '');

export function getApiBaseUrl(): string {
  return (
    API_BASE || (typeof window !== 'undefined' ? window.location.origin : '')
  );
}

let isRefreshing = false;
let refreshPromise: Promise<Response> | null = null;

function clearAndRedirect(): void {
  window.location.href = '/login';
}

async function doRefresh(): Promise<Response> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  const url = API_BASE ? `${API_BASE}${AUTH_REFRESH}` : AUTH_REFRESH;
  refreshPromise = fetch(url, {
    method: 'POST',
    credentials: 'include',
  });
  try {
    const res = await refreshPromise;
    return res;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
}

/**
 * Custom fetch: on 401 (except auth paths), refresh once then retry.
 * Clones request for first attempt so the original can be retried after refresh.
 */
async function fetchWithRefresh(input: Request): Promise<Response> {
  const cloned = input.clone();
  const response = await fetch(cloned, { credentials: 'include' });

  if (response.status !== 401 || isAuthPath(input.url)) {
    return response;
  }

  const refreshRes = await doRefresh();
  if (!refreshRes.ok) {
    clearAndRedirect();
    return response;
  }

  return fetch(input, { credentials: 'include' });
}

/**
 * Fetch wrapper with automatic token refresh on 401.
 * Can be used with Request objects or (url, options) like standard fetch.
 * Exported for use in RTK Query endpoints and other direct fetch calls.
 */
export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  // Convert to Request if needed, ensuring credentials are included
  const request =
    input instanceof Request
      ? input
      : new Request(input, {
          ...init,
          credentials: 'include',
        });

  // Make initial request
  const cloned = request.clone();
  const response = await fetch(cloned, { credentials: 'include' });

  // If not 401 or is an auth path, return response as-is
  if (response.status !== 401 || isAuthPath(request.url)) {
    return response;
  }

  // Attempt to refresh token
  const refreshRes = await doRefresh();
  if (!refreshRes.ok) {
    clearAndRedirect();
    return response;
  }

  // Retry original request after successful refresh
  return fetch(request, { credentials: 'include' });
}

const client = createClient<paths>({
  baseUrl: API_BASE,
  credentials: 'include',
  fetch: fetchWithRefresh,
});

client.use({
  onResponse({ response }: { response: Response }) {
    if (!response.ok) {
      const err = Object.assign(
        new Error(`${response.status} ${response.statusText}`),
        { response },
      ) as Error & { response: Response };
      throw err;
    }
  },
});

export const apiClient = client;
