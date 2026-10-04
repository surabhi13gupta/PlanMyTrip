import { useState } from 'react'
import { formatShortDate } from '../lib/dates'
import type { TripDay } from '../types'

/** Day chips that scroll to a day; the strip scrolls sideways on mobile (frontend-spec.md §4.5). */
export function DayNav({ days }: { days: TripDay[] }) {
  const [active, setActive] = useState(1)

  const goTo = (dayNumber: number) => {
    setActive(dayNumber)
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    document
      .getElementById(`day-${dayNumber}`)
      ?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <nav aria-label="Days" className="-mx-4 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
      <ul className="flex w-max gap-2">
        {days.map((day) => (
          <li key={day.dayNumber}>
            <button
              type="button"
              aria-current={active === day.dayNumber ? 'true' : undefined}
              onClick={() => goTo(day.dayNumber)}
              className={
                'min-h-11 shrink-0 rounded-full border px-3.5 text-sm font-medium tabular-nums transition-colors ' +
                'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary ' +
                (active === day.dayNumber
                  ? 'border-primary bg-primary text-surface'
                  : 'border-line bg-surface text-ink hover:border-primary')
              }
            >
              Day {day.dayNumber} · {formatShortDate(day.date)}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
