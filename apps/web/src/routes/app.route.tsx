import { requireAuth } from '@/shared/lib/require-auth';
import { AppLayout } from '@/shared/components/layouts/AppLayout';
import { TasksPage } from '@/modules/tasks/TasksPage';
import { CreateTaskPage } from '@/modules/tasks/CreateTaskPage';
import { AnalyticsPage } from '@/modules/analytics/AnalyticsPage';
import { indexRoute } from './index.route';

export const appRoute = {
  path: '',
  loader: requireAuth,
  element: <AppLayout />,
  children: [
    indexRoute,
    { path: 'tasks', Component: TasksPage },
    { path: 'tasks/create', Component: CreateTaskPage },
    { path: 'analytics', Component: AnalyticsPage },
  ],
};
