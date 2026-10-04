import { useId, type ReactElement, type ReactNode } from 'react'
import { AlertIcon } from './Icons'

interface FieldProps {
  label: string
  error?: string
  hint?: ReactNode
  /** Render prop so the input gets the right id and aria attributes. */
  children: (props: {
    id: string
    'aria-invalid': boolean
    'aria-describedby'?: string
  }) => ReactElement
}

/** A labelled input with its hint and error linked through aria-describedby (frontend-spec.md §11). */
export function Field({ label, error, hint, children }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')
  return (
    <div className="grid min-w-0 gap-1.5">
      <label htmlFor={id} className="text-[0.9375rem] font-medium">
        {label}
      </label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy || undefined })}
      {hint && (
        <p id={hintId} className="text-sm text-muted">
          {hint}
        </p>
      )}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  )
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  // Icon + text: errors are never shown by color alone.
  return (
    <p id={id} className="flex items-start gap-1.5 text-sm text-danger">
      <span className="mt-0.5">
        <AlertIcon />
      </span>
      <span>{children}</span>
    </p>
  )
}

export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-danger bg-surface p-3 text-danger">
      <span className="mt-0.5">
        <AlertIcon />
      </span>
      <span>{children}</span>
    </div>
  )
}
