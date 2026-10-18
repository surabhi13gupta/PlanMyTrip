import { activitiesForDay } from '../lib/activities'
import { formatDayLabel } from '../lib/dates'
import type { DayForecast } from '../lib/weather'
import type { Activity, TripDay } from '../types'
import { DayWeather } from './DayWeather'
import { MapLink } from './MapLink'
import { cardClass } from './ui'

/** One read-only day on the Shared Trip page: no add, edit, or delete (frontend-spec.md §4.10). */
export function SharedDayCard({
  day,
  activities,
  destination,
  forecast,
}: {
  day: TripDay
  activities: Activity[]
  destination: string
  forecast?: DayForecast
}) {
  const items = activitiesForDay(activities, day.dayNumber)
  const headingId = `day-${day.dayNumber}-heading`
  return (
    <section id={`day-${day.dayNumber}`} aria-labelledby={headingId} className={`${cardClass} grid scroll-mt-24 gap-3 p-[18px]`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={headingId} className="text-lg font-semibold text-primary">
          Day {day.dayNumber}
        </h2>
        <span className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
          <span className="text-[0.9375rem] text-muted">{formatDayLabel(day.date)}</span>
          <DayWeather date={day.date} forecast={forecast} />
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-muted italic">Nothing planned</p>
      ) : (
        <ul className="grid">
          {items.map((activity) => (
            <li
              key={activity.id}
              className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-3 border-t border-line py-3 first:border-t-0"
            >
              <span className={activity.time ? 'font-medium text-primary tabular-nums' : 'text-muted'}>
                {activity.time ?? 'No time'}
              </span>
              <div className="grid min-w-0 gap-0.5">
                <span className="font-medium break-words">{activity.title}</span>
                {activity.notes && (
                  <span className="text-[0.9375rem] break-words whitespace-pre-line text-muted">{activity.notes}</span>
                )}
                <MapLink query={`${activity.title}, ${destination}`} label={activity.title} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
