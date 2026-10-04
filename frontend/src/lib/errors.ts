import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { toast } from 'sonner'
import { ApiError } from '../api/client'

/** Puts server field errors (400 VALIDATION_ERROR, 409 USERNAME_TAKEN) onto the form's fields. */
export function applyFieldErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly string[],
): boolean {
  if (!(error instanceof ApiError)) return false
  let applied = false
  for (const detail of error.fieldErrors) {
    if (fields.includes(detail.field)) {
      setError(detail.field as Path<T>, { type: 'server', message: detail.message })
      applied = true
    }
  }
  return applied
}

/** The message to show for an error nobody handled more specifically (frontend-spec.md §12). */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 503) {
      return 'The service is starting up or unavailable. Please try again in a moment.'
    }
    if (error.status === 0 || error.status >= 500) return 'Something went wrong. Please try again.'
    return error.message
  }
  return 'Something went wrong. Please try again.'
}

export function toastError(error: unknown): void {
  // 401s are handled globally (session-expired flow), so don't add a second message.
  if (error instanceof ApiError && error.status === 401 && error.code === 'UNAUTHORIZED') return
  toast.error(errorMessage(error))
}
