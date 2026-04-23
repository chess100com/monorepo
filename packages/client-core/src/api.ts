import { clientCoreConfig } from './config.js';

class HttpError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${clientCoreConfig.apiBase}${path}`, {
    ...init,
    credentials: clientCoreConfig.fetchCredentials,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  const text = await res.text();
  const body: unknown = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = typeof body === 'object' && body !== null && 'error' in body && typeof (body as { error: unknown }).error === 'string'
      ? (body as { error: string }).error
      : `HTTP ${res.status}`;
    throw new HttpError(res.status, message, body);
  }

  return body as T;
}

export { HttpError };
