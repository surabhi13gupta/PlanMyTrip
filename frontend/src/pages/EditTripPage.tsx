import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ApiError } from '../api/client'
import { tripPaths } from '../api/trips'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ErrorState, Skeleton } from '../components/States'
import { TripForm } from '../components/TripForm'
import { useTrip, useUpdateTrip } from '../hooks/useTrips'
import { countActivitiesBeyondDay } from '../lib/activities'
import { getTripDuration } from '../lib/dates'
import { errorMessage } from '../lib/errors'
import type { TripValues } from '../lib/schemas'
import type { TripDetail } from '../types'
import { NotFoundContent } from './NotFoundPage'

/** Change a trip's dates, destination, or Trip Type (US7). */
export default function EditTripPage() {
  const { tripId = '' } = useParams()
  const trip = useTrip(tripId)

  if (trip.isPending) return <Skeleton className="h-96 max-w-xl" />
  if (trip.isError) {
    if (trip.error instanceof ApiError && trip.error.status === 404) return <NotFoundContent />
    return <ErrorState message={errorMessage(trip.error)} onRetry={() => void trip.refetch()} />
  }
  return <EditTrip trip={trip.data} />
}

function activitiesWord(n: number) {
  return `${n} ${n === 1 ? 'activity' : 'activities'}`
}

function EditTrip({ trip }: { trip: TripDetail }) {
  const navigate = useNavigate()
  const update = useUpdateTrip(trip.id)
  // When saving would delete activities, hold the values until the user confirms.
  const [pending, setPending] = useState<{ values: TripValues; count: number } | null>(null)

  const save = async (values: TripValues, confirmDeleteActivities: boolean) => {
    try {
      await update.mutateAsync({ ...values, confirmDeleteActivities })
    } catch (error) {
      // Activities were added elsewhere since this page loaded: ask again with the server's count.
      if (error instanceof ApiError && error.code === 'ACTIVITIES_WOULD_BE_DELETED') {
        const count = Number(error.details[0]?.activitiesToDelete ?? 0)
        setPending({ values, count })
        return
      }
      throw error
    }
    setPending(null)
    toast.success('Trip updated')
    navigate(`/trips/${trip.id}`)
  }

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold text-primary">Edit trip</h1>
      <TripForm
        submitLabel="Save"
        originalStartDate={trip.startDate}
        defaultValues={{
          startDate: trip.startDate,
          endDate: trip.endDate,
          destination: trip.destination,
          tripType: trip.tripType,
        }}
        onCancel={() => navigate(`/trips/${trip.id}`)}
        onSubmit={async (values) => {
          const count = countActivitiesBeyondDay(
            trip.activities,
            getTripDuration(values.startDate, values.endDate),
          )
          if (count > 0) {
            setPending({ values, count })
            return
          }
          await save(values, false)
        }}
        unsaved={{
          key: `edit-trip-${trip.id}`,
          // Never auto-save a change that would delete activities: that needs confirmation.
          toPendingSave: (values) =>
            countActivitiesBeyondDay(trip.activities, getTripDuration(values.startDate, values.endDate)) > 0
              ? null
              : { method: 'PATCH', path: tripPaths.trip(trip.id), body: values },
        }}
      />
      <ConfirmDialog
        open={pending !== null}
        title="Remove days from this trip?"
        message={
          pending
            ? `Your new dates remove days that have ${activitiesWord(pending.count)}. They will be deleted.`
            : ''
        }
        confirmLabel="Delete and save"
        destructive
        busy={update.isPending}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!pending) return
          save(pending.values, true).catch((error: unknown) => {
            setPending(null)
            toast.error(errorMessage(error))
          })
        }}
      />
    </div>
  )
}
