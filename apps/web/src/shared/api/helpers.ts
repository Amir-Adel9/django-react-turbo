/**
 * Extract error message from API response.
 * Backend returns { detail: string } or { detail: Record<string, string[]> } for validation.
 * When using openapi-fetch, errors have a .response property.
 */
export async function extractErrorMessage(
  err: unknown,
  fallback = 'Something went wrong',
): Promise<string> {
  if (err && typeof err === 'object' && 'response' in err) {
    try {
      const res = (err as { response: Response }).response;
      const body = (await res.clone().json()) as {
        detail?: string | Record<string, string[]>;
      };
      if (body?.detail) {
        if (typeof body.detail === 'string') return body.detail;
        const messages = Object.values(body.detail).flat();
        const text = messages.filter((m): m is string => typeof m === 'string');
        if (text.length) return text.join(' ');
      }
    } catch {
      // body consumed or not JSON
    }
  }
  if (err && typeof err === 'object' && 'data' in err) {
    const data = (err as { data?: unknown }).data;
    if (data && typeof data === 'object' && data !== null && 'detail' in data) {
      const detail = (data as { detail: unknown }).detail;
      if (typeof detail === 'string') return detail;
      if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
        const messages = Object.values(detail).flat();
        const text = messages.filter((m): m is string => typeof m === 'string');
        if (text.length) return text.join(' ');
      }
    }
  }
  return err instanceof Error ? err.message : fallback;
}
