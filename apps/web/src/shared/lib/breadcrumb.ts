export interface BreadcrumbSegment {
  label: string;
  path: string;
}

const ROUTE_LABELS: Record<string, string> = {
  '': 'Dashboard',
  tasks: 'My Tasks',
  create: 'Create Task',
  analytics: 'Analytics & Reports',
};

/**
 * Derive breadcrumb segments from pathname for app layout.
 * e.g. / -> [Dashboard], /tasks -> [Dashboard, My Tasks], /tasks/create -> [Dashboard, My Tasks, Create Task]
 */
export function getBreadcrumbsFromPath(pathname: string): BreadcrumbSegment[] {
  const segments = pathname.split('/').filter(Boolean);
  const result: BreadcrumbSegment[] = [{ label: ROUTE_LABELS[''] ?? 'Dashboard', path: '/' }];
  let acc = '';
  for (const seg of segments) {
    acc += `/${seg}`;
    const label = ROUTE_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
    result.push({ label, path: acc });
  }
  return result;
}
