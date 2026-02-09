import { requireAuth } from '@/shared/lib/require-auth';
import { DashboardLayout } from '@/modules/dashboard/DashboardLayout';

export const indexRoute = {
  index: true,
  loader: requireAuth,
  Component: DashboardLayout,
};
