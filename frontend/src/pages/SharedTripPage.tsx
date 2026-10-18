import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { ApiError } from '../api/client'
import { DayNav } from '../components/DayNav'
import { WeatherCredit } from '../components/DayWeather'
import { UserMenu } from '../components/Layouts'
import { PrintButton } from '../components/PrintButton'
import { SharedDayCard } from '../components/SharedDayCard'
import { SiteBanner } from '../components/SiteBanner'
import { SiteFooter } from '../components/SiteFooter'
import { ErrorState, Skeleton } from '../components/States'
import { TripTypeBadge } from '../components/TripCard'
import { buttonClass, cardClass } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { useSharedTrip } from '../hooks/useTrips'
import { useTripWeather } from '../hooks/useWeather'
import { formatDuration, formatFromTo, getTripDays } from '../lib/dates'
import { errorMessage } from '../lib/errors'
import type { SharedTrip, TripDetail } from '../types'

/**
 * The shared copy as a TripDetail, so the PDF and day cards can be reused. The API sends no IDs
 * or timestamps; activities arrive sorted, and the made-up `createdAt` keeps that order.
 */
function sharedToTripDetail(shared: SharedTrip, shareToken: string): TripDetail {
  const epoch = Date.UTC(2000, 0, 1)
  const stamp = new Date(epoch).toISOString()
  return {
    ...shared,
    id: `shared-${shareToken}`,
    createdAt: stamp,
    updatedAt: stamp,
    shareToken,
    activities: shared.activities.map((activity, i) => ({
      ...activity,
      id: `shared-${i}`,
      createdAt: new Date(epoch + i * 1000).toISOString(),
      updatedAt: stamp,
    })),
  }
}

/** A trip someone shared, read-only, for anyone with the link (frontend-spec.md §4.10, US13). */
export default function SharedTripPage() {
  const { shareToken = '' } = useParams()
  const { user } = useAuth()
  const shared = useSharedTrip(shareToken)

  // Shared pages stay out of search engines.
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  const notFound = shared.error instanceof ApiError && shared.error.status === 404

  return (
    <div className="min-h-dvh">
      <SiteBanner>{user && <UserMenu />}</SiteBanner>
      <main className="mx-auto grid max-w-5xl gap-5 px-4 pt-8 pb-12 md:px-6">
        {shared.isPending ? (
          <div className="grid gap-5" aria-busy="true" aria-label="Loading trip">
            <Skeleton className="h-32" />
            <Skeleton className="h-36" />
          </div>
        ) : notFound ? (
          <div className={`${cardClass} grid justify-items-start gap-2 p-6`}>
            <h1 className="text-2xl font-semibold text-primary">This link isn't active</h1>
            <p className="text-muted">Ask the person who shared it for a new link.</p>
          </div>
        ) : shared.isError ? (
          <ErrorState message={errorMessage(shared.error)} onRetry={() => void shared.refetch()} />
        ) : (
          <SharedPlan trip={sharedToTripDetail(shared.data, shareToken)} />
        )}

        {!shared.isPending && (
          <div className={`${cardClass} grid justify-items-start gap-3 bg-primary-soft p-5`}>
            <h2 className="text-lg font-semibold text-primary">Plan your own trip with PlanMyTrip</h2>
            {user ? (
              <Link to="/trips" className={buttonClass.primary}>
                Go to My Trips
              </Link>
            ) : (
              <Link to="/signup" className={buttonClass.primary}>
                Create a free account
              </Link>
            )}
          </div>
        )}
        <SiteFooter />
      </main>
    </div>
  )
}

function SharedPlan({ trip }: { trip: TripDetail }) {
  const days = getTripDays(trip.startDate, trip.endDate)
  const weather = useTripWeather(trip.destination, trip.startDate, trip.endDate)

  useEffect(() => {
    const previous = document.title
    document.title = `Trip to ${trip.destination} · PlanMyTrip`
    return () => {
      document.title = previous
    }
  }, [trip.destination])

  return (
    <>
      <header className={`${cardClass} grid gap-3 p-5`}>
        <p className="text-xs font-medium tracking-[0.08em] text-muted uppercase">Shared trip · Read-only</p>
        <div className="flex items-start justify-between gap-3">
          <h1 className="min-w-0 text-2xl font-semibold break-words text-primary">{trip.destination}</h1>
          <TripTypeBadge tripType={trip.tripType} />
        </div>
        <p className="text-muted tabular-nums">
          {formatFromTo(trip.startDate, trip.endDate)} · {formatDuration(trip.durationDays)}
        </p>
      </header>

      <DayNav days={days} />
      {weather.size > 0 && <WeatherCredit />}

      {days.map((day) => (
        <SharedDayCard
          key={day.dayNumber}
          day={day}
          activities={trip.activities}
          destination={trip.destination}
          forecast={weather.get(day.date)}
        />
      ))}

      <div>
        <PrintButton trip={trip} label="Download PDF" />
      </div>
    </>
  )
}
