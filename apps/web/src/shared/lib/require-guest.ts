import { redirect } from 'react-router-dom';
import { apiClient } from '@/shared/api/http-client';

/**
 * Loader helper for guest-only routes (login, register).
 * If user is already authenticated (GET /api/auth/me returns 200), redirects to /.
 * Otherwise returns null so the route can render.
 */
export async function requireGuest(): Promise<null | ReturnType<typeof redirect>> {
  try {
    const result = await apiClient.GET('/api/auth/me');
    if (result.data) return redirect('/');
    return null;
  } catch {
    return null;
  }
}
