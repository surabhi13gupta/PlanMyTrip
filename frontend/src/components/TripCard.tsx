import { Link } from 'react-router'
import { formatDateRange, formatDuration } from '../lib/dates'
import { TRIP_TYPES, type Trip } from '../types'

export function TripTypeBadge({ tripType }: { tripType: Trip['tripType'] }) {
  const label = TRIP_TYPES.find((t) => t.value === tripType)?.label ?? tripType
  return (
    <span className="inline-block shrink-0 rounded-full bg-primary-soft px-2.5 py-0.5 text-[0.8125rem] font-medium text-primary">
      {label}
    </span>
  )
}

/** One trip on My Trips: destination, dates, Trip Type (frontend-spec.md §4.3). */
export function TripCard({ trip, past = false }: { trip: Trip; past?: boolean }) {
  return (
    <Link
      to={`/trips/${trip.id}`}
      className={
        'grid gap-2 rounded-[10px] border border-line bg-surface p-[18px] transition-colors hover:border-primary ' +
        'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary'
      }
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="min-w-0 text-[1.0625rem] font-semibold break-words text-primary">
          {trip.destination}
        </h3>
        <TripTypeBadge tripType={trip.tripType} />
      </div>
      <p className="text-[0.9375rem] text-muted tabular-nums">
        {formatDateRange(trip.startDate, trip.endDate)} · {formatDuration(trip.durationDays)}
        {past && ' · Past'}
      </p>
    </Link>
  )
}
