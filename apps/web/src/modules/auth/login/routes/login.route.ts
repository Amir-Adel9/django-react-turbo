import { requireGuest } from '@/shared/lib/require-guest';
import { Login } from '../Login';

export const loginRoute = {
  path: 'login',
  loader: requireGuest,
  Component: Login,
};
