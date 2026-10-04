import { useEffect, useRef } from 'react'
import { registerUnsavedForm, type PendingSave } from '../lib/unsavedForms'

/**
 * Registers an open form so its unsaved, valid changes are saved if the page closes.
 * `getPending` is read at close time, so it always sees the latest values.
 */
export function useUnsavedFormRegistry(key: string, getPending: () => PendingSave | null): void {
  const latest = useRef(getPending)
  useEffect(() => {
    latest.current = getPending
  })
  useEffect(() => registerUnsavedForm(key, () => latest.current()), [key])
}
