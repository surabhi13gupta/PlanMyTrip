// The one place the app talks to the backend (frontend-spec.md §12, api-contract-spec.md §1–2).

export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export interface FieldErrorDetail {
  field: string
  message: string
}

/** Any non-2xx answer (or no answer at all), in the contract's error shape. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: Record<string, unknown>[]

  constructor(status: number, code: string, message: string, details: Record<string, unknown>[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  /** Field errors from a 400 VALIDATION_ERROR or 409 USERNAME_TAKEN. */
  get fieldErrors(): FieldErrorDetail[] {
    return this.details.filter(
      (d): d is Record<string, unknown> & FieldErrorDetail =>
        typeof d.field === 'string' && d.field !== '' && typeof d.message === 'string',
    )
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

function requestInit(method: Method, body?: unknown, extra?: RequestInit): RequestInit {
  return {
    method,
    credentials: 'include',
    // Every write sends JSON's content type, even with no body: the backend's CSRF check needs it.
    headers: method === 'GET' ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    ...extra,
  }
}

export async function apiRequest<T>(method: Method, path: string, body?: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, requestInit(method, body))
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', "Can't reach the server. Check your connection.")
  }
  if (response.status === 204) return undefined as T
  const data: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const error = (data as { error?: { code?: string; message?: string; details?: unknown } } | null)
      ?.error
    throw new ApiError(
      response.status,
      error?.code ?? 'HTTP_ERROR',
      error?.message ?? 'Something went wrong. Please try again.',
      Array.isArray(error?.details) ? (error.details as Record<string, unknown>[]) : [],
    )
  }
  return data as T
}

/**
 * Fire-and-forget request that keeps going after the page closes (`keepalive`).
 * Used only to save unsaved forms on `pagehide` (frontend-spec.md §12).
 */
export function sendKeepalive(method: 'POST' | 'PATCH', path: string, body: unknown): void {
  void fetch(`${API_BASE_URL}${path}`, requestInit(method, body, { keepalive: true })).catch(() => {})
}

export const api = {
  get: <T>(path: string) => apiRequest<T>('GET', path),
  post: <T>(path: string, body?: unknown) => apiRequest<T>('POST', path, body),
  patch: <T>(path: string, body: unknown) => apiRequest<T>('PATCH', path, body),
  delete: (path: string) => apiRequest<void>('DELETE', path),
}
