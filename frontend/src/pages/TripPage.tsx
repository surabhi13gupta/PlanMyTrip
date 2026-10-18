import { useCallback, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { ApiError } from '../api/client'
import { BackLink } from '../components/BackLink'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { DayCard } from '../components/DayCard'
import { DayNav } from '../components/DayNav'
import { WeatherCredit } from '../components/DayWeather'
import { IdeaGlyph } from '../components/IdeaGlyph'
import { IdeasPanel } from '../components/IdeasPanel'
import { PrintButton } from '../components/PrintButton'
import { ShareDialog } from '../components/ShareDialog'
import { ErrorState, Skeleton } from '../components/States'
import { TripTypeBadge } from '../components/TripCard'
import { buttonClass, cardClass, linkClass } from '../components/ui'
import { useDeleteTrip, useTrip } from '../hooks/useTrips'
import { useTripWeather } from '../hooks/useWeather'
import { formatDuration, formatFromTo, formatShortDate, getTripDays, todayISO } from '../lib/dates'
import { errorMessage, toastError } from '../lib/errors'
import type { TripDetail } from '../types'
import { NotFoundContent } from './NotFoundPage'

/** The trip's day-by-day plan with Print, Delete, Edit, Share, weather, and the Ideas panel (US5–US13; mockup "Saved trip"). */
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
  const [sharing, setSharing] = useState(false)
  const weather = useTripWeather(trip.destination, trip.startDate, trip.endDate)
  const [ideasOpen, setIdeasOpen] = useState(false)
  // The day the Ideas panel adds to; null until the panel is first opened (§4.5.1).
  const [ideasDay, setIdeasDay] = useState<number | null>(null)
  const closeIdeas = useCallback(() => setIdeasOpen(false), [])
  const openIdeas = (dayNumber?: number) => {
    setIdeasDay(dayNumber ?? ideasDay ?? defaultIdeasDay(days))
    setIdeasOpen(true)
  }
  // Shortening the trip can remove the picked day.
  const pickedDay = ideasDay !== null && ideasDay <= days.length ? ideasDay : defaultIdeasDay(days)

  return (
    <div
      className={
        'grid items-start gap-5 ' +
        // Docked (xl), the page widens from the layout's 1024px to up to 1216px so the plan keeps
        // its width beside the 440px panel (§4.5.1). The 4rem leaves room for a scrollbar.
        (ideasOpen ? 'xl:-mx-[calc((min(100vw_-_4rem,76rem)_-_100%)_/_2)] xl:grid-cols-[minmax(0,1fr)_440px]' : '')
      }
    >
      <div className="grid min-w-0 gap-5">
        <div className="-mb-3">
          <BackLink to="/trips">My Trips</BackLink>
        </div>
        <header className={`${cardClass} grid gap-3 p-5`}>
          <div className="flex items-start justify-between gap-3">
            <h1 className="min-w-0 text-2xl font-semibold break-words text-primary">{trip.destination}</h1>
            <TripTypeBadge tripType={trip.tripType} />
          </div>
          <p className="text-muted tabular-nums">
            {formatFromTo(trip.startDate, trip.endDate)} · {formatDuration(trip.durationDays)}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link to={`/trips/${trip.id}/edit`} className={linkClass}>
              Edit
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={`${buttonClass.secondary} min-h-10 pl-2.5`}
                aria-haspopup="dialog"
                onClick={() => setSharing(true)}
              >
                <ShareIcon />
                {trip.shareToken ? (
                  <>
                    Shared
                    <span aria-hidden="true" className="size-2 rounded-full bg-success" />
                  </>
                ) : (
                  'Share'
                )}
              </button>
              <button
                type="button"
                className={`${buttonClass.secondary} min-h-10 pl-2.5 aria-expanded:bg-primary-soft`}
                aria-expanded={ideasOpen}
                onClick={() => (ideasOpen ? closeIdeas() : openIdeas())}
              >
                <IdeaGlyph icon="bulb" />
                Ideas for {trip.destination}
              </button>
            </div>
          </div>
        </header>

        <DayNav days={days} />
        {weather.size > 0 && <WeatherCredit />}

        {days.map((day) => (
          <DayCard
            key={day.dayNumber}
            tripId={trip.id}
            destination={trip.destination}
            day={day}
            activities={trip.activities}
            onFindIdeas={openIdeas}
            forecast={weather.get(day.date)}
          />
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
      </div>

      <IdeasPanel
        trip={trip}
        days={days}
        open={ideasOpen}
        dayNumber={pickedDay}
        onDayChange={setIdeasDay}
        onClose={closeIdeas}
      />

      <ShareDialog trip={trip} open={sharing} onClose={() => setSharing(false)} />

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

function ShareIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="15" cy="4.5" r="2" />
      <circle cx="5" cy="10" r="2" />
      <circle cx="15" cy="15.5" r="2" />
      <path d="M6.8 9l6.4-3.5M6.8 11l6.4 3.5" />
    </svg>
  )
}

/** Today's day if the trip is under way, else Day 1 (§4.5.1). */
function defaultIdeasDay(days: { dayNumber: number; date: string }[]): number {
  return days.find((day) => day.date === todayISO())?.dayNumber ?? 1
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
