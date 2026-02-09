import { redirect } from 'react-router-dom';
import { apiClient } from '@/shared/api/http-client';
import type { User } from '@/shared/api/api.types';

export interface AuthLoaderData {
  user: User;
}

/**
 * Loader helper for protected routes. Calls GET /api/auth/me (httpOnly cookie).
 * Returns { user } on success, redirects to /login on 401 or failure.
 */
export async function requireAuth(): Promise<
  AuthLoaderData | ReturnType<typeof redirect>
> {
  try {
    const result = await apiClient.GET('/api/auth/me');
    if (!result.data) return redirect('/login?fromAuthFailure=1');
    return { user: result.data as User };
  } catch {
    return redirect('/login?fromAuthFailure=1');
  }
}
