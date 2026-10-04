import { zodResolver } from '@hookform/resolvers/zod'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useUnsavedFormRegistry } from '../hooks/useUnsavedFormRegistry'
import { applyFieldErrors, errorMessage, toastError } from '../lib/errors'
import { activitySchema, type ActivityValues } from '../lib/schemas'
import type { PendingSave } from '../lib/unsavedForms'
import { Field, FormAlert } from './Field'
import { Spinner } from './Icons'
import { buttonClass, inputClass } from './ui'

interface ActivityFormProps {
  /** Unique per open form, e.g. "add-day-2" or "edit-<activityId>". */
  formKey: string
  defaultValues?: ActivityValues
  submitLabel: string
  onSubmit: (values: ActivityValues) => Promise<void>
  onCancel: () => void
  /** The request that would save these values, used if the page closes before Save. */
  toPendingSave: (values: ActivityValues) => PendingSave
}

const EMPTY: ActivityValues = { title: '', time: '', notes: '' }

/** Inline add/edit form inside a day card (frontend-spec.md §4.5). */
export function ActivityForm({
  formKey,
  defaultValues = EMPTY,
  submitLabel,
  onSubmit,
  onCancel,
  toPendingSave,
}: ActivityFormProps) {
  const { register, handleSubmit, setError, getValues, formState } = useForm<ActivityValues>({
    resolver: zodResolver(activitySchema),
    defaultValues,
    mode: 'onTouched',
  })
  const [formError, setFormError] = useState<string | null>(null)
  // While Save is already sending, closing the page must not send the same change twice.
  const saving = useRef(false)

  // If the page closes with valid unsaved changes, save them (frontend-spec.md §12).
  useUnsavedFormRegistry(formKey, () => {
    if (saving.current) return null
    const values = getValues()
    if (JSON.stringify(values) === JSON.stringify(defaultValues)) return null
    const parsed = activitySchema.safeParse(values)
    return parsed.success ? toPendingSave(parsed.data) : null
  })

  const submit = handleSubmit(async (values) => {
    setFormError(null)
    saving.current = true
    try {
      await onSubmit(values)
    } catch (error) {
      saving.current = false
      // The form stays open with what the user typed (frontend-spec.md §4.5).
      if (!applyFieldErrors(error, setError, ['title', 'time', 'notes'])) {
        setFormError(errorMessage(error))
        toastError(error)
      }
    }
  })

  return (
    <form
      noValidate
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          onCancel()
        }
      }}
      className="grid gap-3 rounded-lg border border-line bg-sand/50 p-3"
    >
      {formError && <FormAlert>{formError}</FormAlert>}
      <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
        <Field label="Title" error={formState.errors.title?.message}>
          {(a11y) => (
            <input {...a11y} type="text" autoFocus maxLength={100} className={inputClass} {...register('title')} />
          )}
        </Field>
        <Field label="Time (optional)" error={formState.errors.time?.message}>
          {(a11y) => <input {...a11y} type="time" className={inputClass} {...register('time')} />}
        </Field>
      </div>
      <Field label="Notes (optional)" error={formState.errors.notes?.message}>
        {(a11y) => (
          <textarea
            {...a11y}
            rows={2}
            maxLength={500}
            className={`${inputClass} py-2`}
            {...register('notes')}
          />
        )}
      </Field>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={buttonClass.primary} disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Spinner />}
          {submitLabel}
        </button>
        <button type="button" className={buttonClass.ghost} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
