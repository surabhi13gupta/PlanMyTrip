// Loaded only when the user clicks Print (frontend-spec.md §13), so the PDF library stays out of
// the first download.
import { pdf } from '@react-pdf/renderer'
import { itineraryFileName } from '../lib/itineraryFileName'
import type { TripDetail } from '../types'
import { ItineraryPdf } from './ItineraryPdf'

export async function exportItinerary(trip: TripDetail): Promise<void> {
  // ItineraryPdf returns the <Document> element that react-pdf expects at the top.
  const blob = await pdf(ItineraryPdf({ trip })).toBlob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = itineraryFileName(trip.destination, trip.startDate)
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
