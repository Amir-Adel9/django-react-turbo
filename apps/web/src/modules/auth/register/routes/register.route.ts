import { requireGuest } from '@/shared/lib/require-guest';
import { Register } from '../Register';

export const registerRoute = {
  path: 'register',
  loader: requireGuest,
  Component: Register,
};
