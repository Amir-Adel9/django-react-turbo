/**
 * Base URL: same origin so /api/* hits Vite proxy to Django (localhost:8000).
 * All requests use credentials: 'include' for HttpOnly cookies.
 */
const BASE_URL =
  typeof window !== "undefined" ? "" : process.env.VITE_API_BASE_URL ?? "";

export function getApiBaseUrl(): string {
  return BASE_URL;
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}
