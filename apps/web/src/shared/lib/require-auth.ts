import { redirect } from 'react-router-dom';
import { getApiBaseUrl, fetchWithAuth } from '@/shared/api/http-client';
import type { User } from '@/shared/api/api.types';

export interface AuthLoaderData {
  user: User;
}

/**
 * Loader helper for protected routes. Calls GET /api/auth/me (httpOnly cookie).
 * Returns { user } on success, redirects to /login on 401 or failure.
 * Automatically attempts token refresh on 401 before redirecting.
 */
export async function requireAuth(
  _args?: unknown,
): Promise<AuthLoaderData | ReturnType<typeof redirect>> {
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
