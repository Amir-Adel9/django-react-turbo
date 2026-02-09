import { redirect } from 'react-router-dom';
import { getApiBaseUrl, fetchWithAuth } from '@/shared/api/http-client';

/**
 * Loader helper for guest-only routes (login, register).
 * If user is already authenticated (GET /api/auth/me returns 200), redirects to /.
 * Otherwise returns null so the route can render.
 * Automatically attempts token refresh on 401.
 */
export async function requireGuest(
  _args?: unknown,
): Promise<null | ReturnType<typeof redirect>> {
  try {
    const base = getApiBaseUrl();
    const url = `${base ? base.replace(/\/$/, '') : ''}/api/auth/me`;
    const res = await fetchWithAuth(url, { credentials: 'include' });
    if (res.ok) return redirect('/');
    return null;
  } catch {
    return null;
  }
}
