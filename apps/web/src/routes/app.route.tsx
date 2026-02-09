import { requireAuth } from '@/shared/lib/require-auth';
import { AppLayout } from '@/shared/components/layouts/AppLayout';
import { TasksPlaceholderPage } from '@/modules/tasks/TasksPlaceholderPage';
import { CreateTaskPlaceholderPage } from '@/modules/tasks/CreateTaskPlaceholderPage';
import { AnalyticsPlaceholderPage } from '@/modules/analytics/AnalyticsPlaceholderPage';
import { indexRoute } from './index.route';

export const appRoute = {
  path: '',
  loader: requireAuth,
  element: <AppLayout />,
  children: [
    indexRoute,
    { path: 'tasks', Component: TasksPlaceholderPage },
    { path: 'tasks/create', Component: CreateTaskPlaceholderPage },
    { path: 'analytics', Component: AnalyticsPlaceholderPage },
  ],
};
