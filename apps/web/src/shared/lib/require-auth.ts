import { redirect, type LoaderFunctionArgs } from 'react-router-dom';
import { getApiBaseUrl, fetchWithAuth } from '@/shared/api/http-client';
import type { User } from '@/shared/api/api.types';

export interface AuthLoaderData {
  user: User;
}

const AUTH_PATHS = ['/login', '/register'];

/**
 * Loader helper for protected routes. Calls GET /api/auth/me (httpOnly cookie).
 * Returns { user } on success, redirects to /login on 401 or failure.
 * Automatically attempts token refresh on 401 before redirecting.
 * Skips the API call if we're on an auth page.
 */
export async function requireAuth(
  args?: LoaderFunctionArgs | unknown,
): Promise<AuthLoaderData | ReturnType<typeof redirect>> {
  // Check if we're on an auth page - if so, skip the API call
  // Use request from loader args if available (more reliable), otherwise fall back to window.location
  let currentPath = '';
  const loaderArgs = args as LoaderFunctionArgs | undefined;
  if (loaderArgs?.request) {
    const url = new URL(loaderArgs.request.url);
    currentPath = url.pathname;
  } else if (typeof window !== 'undefined') {
    currentPath = window.location.pathname;
  }

  if (currentPath && AUTH_PATHS.includes(currentPath)) {
    // Don't call /me if we're already on an auth page - just redirect
    return redirect('/login?fromAuthFailure=1');
  }

  try {
    const base = getApiBaseUrl();
    const url = `${base ? base.replace(/\/$/, '') : ''}/api/auth/me`;
    const res = await fetchWithAuth(url, { credentials: 'include' });
    if (!res.ok) return redirect('/login?fromAuthFailure=1');
    const data = (await res.json()) as User;
    return { user: data };
  } catch {
    return redirect('/login?fromAuthFailure=1');
  }
}
