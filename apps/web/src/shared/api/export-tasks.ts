import { getApiBaseUrl, fetchWithAuth } from '@/shared/api/http-client';

export type ExportParams = { from?: string; to?: string; status?: string };

/**
 * Trigger download of tasks export as Excel. Uses credentials (cookies).
 * Automatically attempts token refresh on 401.
 */
export async function downloadTasksExport(params: ExportParams): Promise<void> {
  const url = new URL('/api/tasks/export', getApiBaseUrl() || window.location.origin);
  if (params.from) url.searchParams.set('from', params.from);
  if (params.to) url.searchParams.set('to', params.to);
  if (params.status) url.searchParams.set('status', params.status);

  const res = await fetchWithAuth(url.toString(), { credentials: 'include' });
  if (!res.ok) throw new Error('Export failed');

  const disposition = res.headers.get('Content-Disposition');
  const filename =
    disposition?.match(/filename="?([^";]+)"?/)?.[1] ?? 'tasks_export.xlsx';

  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
