import { useState } from 'react'
import { toast } from 'sonner'
import type { TripDetail } from '../types'
import { Spinner } from './Icons'
import { buttonClass } from './ui'

/**
 * "Print": builds the itinerary PDF in the browser and downloads it (frontend-spec.md §4.5).
 * The PDF library is large, so it's only loaded on click.
 */
export function PrintButton({ trip }: { trip: TripDetail }) {
  const [busy, setBusy] = useState(false)

  const print = async () => {
    setBusy(true)
    try {
      const { exportItinerary } = await import('../pdf/exportItinerary')
      await exportItinerary(trip)
    } catch {
      toast.error("Couldn't create the PDF. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <button type="button" className={buttonClass.primary} onClick={print} disabled={busy}>
      {busy && <Spinner label="Creating PDF" />}
      Print
    </button>
  )
}
