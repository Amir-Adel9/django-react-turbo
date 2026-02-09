import { requireGuest } from '@/shared/lib/require-guest';
import { AuthLayout } from '@/shared/components/layouts/AuthLayout';
import { Login } from '@/modules/auth/login/Login';
import { Register } from '@/modules/auth/register/Register';

export const loginRoute = {
  path: 'login',
  loader: requireGuest,
  element: (
    <AuthLayout>
      <Login />
    </AuthLayout>
  ),
};

export const registerRoute = {
  path: 'register',
  loader: requireGuest,
  element: (
    <AuthLayout>
      <Register />
    </AuthLayout>
  ),
};
