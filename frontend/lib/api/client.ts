import type { ApiError } from './types';

/**
 * Base URL for the frontend Next.js API routes (BFF proxy layer).
 * In the browser this resolves to '' (same origin); on the server it
 * can be overridden via NEXT_PUBLIC_SITE_URL.
 */
const BASE_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_SITE_URL ?? '');

/**
 * Lightweight wrapper around `fetch` with JSON support, error handling, and
 * automatic content-type headers.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const res = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as unknown as T;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMessage = (data as ApiError).error ?? `Request failed with status ${res.status}`;
    throw new ApiClientError(errorMessage, res.status, data);
  }

  return data as T;
}

/**
 * Custom error class that preserves the HTTP status code and response body.
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}
