import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ApiError } from '../api/client'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DayCard } from '../components/DayCard'
import { DayNav } from '../components/DayNav'
import { PrintButton } from '../components/PrintButton'
import { ErrorState, Skeleton } from '../components/States'
import { TripTypeBadge } from '../components/TripCard'
import { buttonClass, cardClass, linkClass } from '../components/ui'
import { useDeleteTrip, useTrip } from '../hooks/useTrips'
import { formatDuration, formatFromTo, formatShortDate, getTripDays } from '../lib/dates'
import { errorMessage, toastError } from '../lib/errors'
import type { TripDetail } from '../types'
import { NotFoundContent } from './NotFoundPage'

/** The trip's day-by-day plan with Print, Delete, and Edit (US5–US7; mockup "Saved trip"). */
export default function TripPage() {
  const { tripId = '' } = useParams()
  const trip = useTrip(tripId)

  if (trip.isPending) return <TripPageSkeleton />
  if (trip.isError) {
    if (trip.error instanceof ApiError && trip.error.status === 404) return <NotFoundContent />
    return <ErrorState message={errorMessage(trip.error)} onRetry={() => void trip.refetch()} />
  }
  return <TripPlan trip={trip.data} />
}

function TripPlan({ trip }: { trip: TripDetail }) {
  const navigate = useNavigate()
  const deleteTrip = useDeleteTrip(trip.id)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const days = getTripDays(trip.startDate, trip.endDate)

  return (
    <div className="grid gap-5">
      <header className={`${cardClass} grid gap-3 p-5`}>
        <div className="flex items-start justify-between gap-3">
          <h1 className="min-w-0 text-2xl font-semibold break-words text-primary">{trip.destination}</h1>
          <TripTypeBadge tripType={trip.tripType} />
        </div>
        <p className="text-muted tabular-nums">
          {formatFromTo(trip.startDate, trip.endDate)} · {formatDuration(trip.durationDays)}
        </p>
        <div>
          <Link to={`/trips/${trip.id}/edit`} className={linkClass}>
            Edit
          </Link>
        </div>
      </header>

      <DayNav days={days} />

      {days.map((day) => (
        <DayCard key={day.dayNumber} tripId={trip.id} day={day} activities={trip.activities} />
      ))}

      {/* Sticks to the bottom on mobile so Print and Delete are always reachable (§4.5). */}
      <div
        className={
          'fixed inset-x-0 bottom-0 z-10 flex gap-3 border-t border-line bg-surface px-4 pt-3 ' +
          'pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] ' +
          'md:static md:justify-end md:rounded-[10px] md:border md:p-3.5'
        }
      >
        <div className="grid flex-1 md:flex-none">
          <PrintButton trip={trip} />
        </div>
        <button
          type="button"
          className={`${buttonClass.danger} flex-1 md:flex-none`}
          onClick={() => setConfirmingDelete(true)}
        >
          Delete
        </button>
      </div>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this trip?"
        message={`Delete your trip to ${trip.destination} (${formatShortDate(trip.startDate)} – ${formatShortDate(trip.endDate)})? All its activities will be deleted too. This can't be undone.`}
        confirmLabel="Delete trip"
        destructive
        busy={deleteTrip.isPending}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() =>
          deleteTrip.mutate(undefined, {
            onSuccess: () => {
              toast.success('Trip deleted')
              navigate('/trips', { replace: true })
            },
            onError: (error) => {
              setConfirmingDelete(false)
              toastError(error)
            },
          })
        }
      />
    </div>
  )
}

function TripPageSkeleton() {
  return (
    <div className="grid gap-5" aria-busy="true" aria-label="Loading trip">
      <Skeleton className="h-32" />
      <Skeleton className="h-11 w-2/3" />
      <Skeleton className="h-36" />
      <Skeleton className="h-36" />
    </div>
  )
}
