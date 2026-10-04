import { Link } from 'react-router'
import { EmptyState, ErrorState, Skeleton } from '../components/States'
import { TripCard } from '../components/TripCard'
import { buttonClass } from '../components/ui'
import { useTrips } from '../hooks/useTrips'
import { sortTripsForHome } from '../lib/activities'
import { errorMessage } from '../lib/errors'

/** My Trips, the home screen (US4; mockup "First screen"). */
export default function TripsPage() {
  const trips = useTrips()

  return (
    <div className="grid gap-8">
      <div className="grid justify-items-start gap-4">
        <h1 className="text-[1.75rem] font-semibold text-balance text-primary">Welcome to PlanMyTrip</h1>
        <Link to="/trips/new" className={buttonClass.primary}>
          + Add new trip
        </Link>
      </div>

      <section aria-labelledby="trip-plans" className="grid gap-4">
        <h2 id="trip-plans" className="text-xl font-semibold text-primary">
          Your trip plans
        </h2>
        <TripList query={trips} />
      </section>
    </div>
  )
}

function TripList({ query }: { query: ReturnType<typeof useTrips> }) {
  if (query.isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading trips">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    )
  }
  if (query.isError) {
    return <ErrorState message={errorMessage(query.error)} onRetry={() => void query.refetch()} />
  }
  if (query.data.length === 0) {
    return (
      <EmptyState
        title="No trips yet"
        message="No trips yet. Add your first trip to start planning."
        action={
          <Link to="/trips/new" className={buttonClass.secondary}>
            + Add new trip
          </Link>
        }
      />
    )
  }
  const { current, past } = sortTripsForHome(query.data)
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {current.map((trip) => (
        <li key={trip.id} className="grid">
          <TripCard trip={trip} />
        </li>
      ))}
      {past.map((trip) => (
        <li key={trip.id} className="grid">
          <TripCard trip={trip} past />
        </li>
      ))}
    </ul>
  )
}
