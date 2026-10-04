import { useId } from 'react'
import { TRIP_TYPES, type TripType } from '../types'
import { FieldError } from './Field'

interface TripTypePickerProps {
  name: string
  value: TripType | ''
  onChange: (value: TripType) => void
  onBlur: () => void
  error?: string
}

/** Four pill-shaped radio buttons: real radios, so arrow keys and screen readers just work. */
export function TripTypePicker({ name, value, onChange, onBlur, error }: TripTypePickerProps) {
  const errorId = useId()
  return (
    <fieldset className="grid gap-2" aria-describedby={error ? errorId : undefined}>
      <legend className="mb-1.5 text-[0.9375rem] font-medium">Trip type</legend>
      <div className="flex flex-wrap gap-2">
        {TRIP_TYPES.map((option) => (
          <label key={option.value} className="relative">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              onBlur={onBlur}
              className="peer sr-only"
            />
            <span
              className={
                'inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-[0.9375rem] font-medium ' +
                'border-field-border bg-surface text-ink ' +
                'peer-checked:border-primary peer-checked:bg-primary-soft peer-checked:text-primary ' +
                'peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary'
              }
            >
              {option.label}
            </span>
          </label>
        ))}
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </fieldset>
  )
}
