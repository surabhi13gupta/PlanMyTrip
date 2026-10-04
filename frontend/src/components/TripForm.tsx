import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useRef, useState } from 'react'
import { Controller, useForm, type Resolver, type UseFormSetError } from 'react-hook-form'
import { useUnsavedFormRegistry } from '../hooks/useUnsavedFormRegistry'
import {
  formatDuration,
  getTripDuration,
  isValidISODate,
  MAX_TRIP_DAYS,
  todayISO,
} from '../lib/dates'
import { applyFieldErrors, errorMessage } from '../lib/errors'
import { tripSchema, type TripFormValues, type TripValues } from '../lib/schemas'
import type { PendingSave } from '../lib/unsavedForms'
import { Field, FormAlert } from './Field'
import { Spinner } from './Icons'
import { TripTypePicker } from './TripTypePicker'
import { buttonClass, inputClass } from './ui'

const TRIP_FIELDS = ['startDate', 'endDate', 'destination', 'tripType'] as const

interface TripFormProps {
  defaultValues?: TripValues
  /** Edit mode: the saved start date, which may already be in the past. */
  originalStartDate?: string
  submitLabel: string
  onSubmit: (values: TripValues, setError: UseFormSetError<TripFormValues>) => Promise<void>
  onCancel: () => void
  /** If given, valid unsaved changes are saved this way when the page closes. */
  unsaved?: { key: string; toPendingSave: (values: TripValues) => PendingSave | null }
}

const EMPTY: TripFormValues = { startDate: '', endDate: '', destination: '', tripType: '' }

/** New and Edit trip form: From, To, Destination, Trip Type (frontend-spec.md §4.4, §4.6). */
export function TripForm({
  defaultValues,
  originalStartDate,
  submitLabel,
  onSubmit,
  onCancel,
  unsaved,
}: TripFormProps) {
  const schema = useMemo(() => tripSchema({ originalStartDate }), [originalStartDate])
  const initial = defaultValues ?? EMPTY
  const form = useForm<TripFormValues, unknown, TripValues>({
    resolver: zodResolver(schema) as unknown as Resolver<TripFormValues, unknown, TripValues>,
    defaultValues: initial,
    mode: 'onTouched', // errors appear once the user leaves a field, and on submit
  })
  const { register, handleSubmit, control, watch, setError, getValues, formState } = form
  const [formError, setFormError] = useState<string | null>(null)
  // While Save is already sending, closing the page must not send the same change twice.
  const saving = useRef(false)

  useUnsavedFormRegistry(unsaved?.key ?? 'trip-form-unregistered', () => {
    if (!unsaved || saving.current) return null
    const values = getValues()
    if (JSON.stringify(values) === JSON.stringify(initial)) return null
    const parsed = schema.safeParse(values)
    return parsed.success ? unsaved.toPendingSave(parsed.data) : null
  })

  const [startDate, endDate] = watch(['startDate', 'endDate'])
  const duration =
    isValidISODate(startDate) && isValidISODate(endDate) && endDate >= startDate
      ? getTripDuration(startDate, endDate)
      : null

  // Date pickers don't offer past dates, except a trip's own earlier start when editing.
  const today = todayISO()
  const minStart = originalStartDate && originalStartDate < today ? originalStartDate : today

  const submit = handleSubmit(async (values) => {
    setFormError(null)
    saving.current = true
    try {
      await onSubmit(values, setError)
    } catch (error) {
      if (!applyFieldErrors(error, setError, TRIP_FIELDS)) setFormError(errorMessage(error))
    } finally {
      saving.current = false
    }
  })

  return (
    <form noValidate onSubmit={submit} className="grid max-w-xl gap-5">
      {formError && <FormAlert>{formError}</FormAlert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="From" error={formState.errors.startDate?.message}>
          {(a11y) => (
            <input {...a11y} type="date" min={minStart} className={inputClass} {...register('startDate')} />
          )}
        </Field>
        <Field label="To" error={formState.errors.endDate?.message}>
          {(a11y) => (
            <input
              {...a11y}
              type="date"
              min={startDate || minStart}
              className={inputClass}
              {...register('endDate')}
            />
          )}
        </Field>
      </div>
      <p aria-live="polite" className="-mt-2 text-[0.9375rem] text-muted">
        {duration !== null
          ? `${formatDuration(duration)}${duration > MAX_TRIP_DAYS ? ` (maximum is ${MAX_TRIP_DAYS})` : ''}`
          : `Up to ${MAX_TRIP_DAYS} days`}
      </p>
      <Field
        label="Destination"
        hint='City and country, e.g. "Kyoto, Japan"'
        error={formState.errors.destination?.message}
      >
        {(a11y) => (
          <input
            {...a11y}
            type="text"
            autoComplete="off"
            maxLength={100}
            className={inputClass}
            {...register('destination')}
          />
        )}
      </Field>
      <Controller
        control={control}
        name="tripType"
        render={({ field, fieldState }) => (
          <TripTypePicker
            name={field.name}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      <div className="flex flex-wrap gap-3">
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
