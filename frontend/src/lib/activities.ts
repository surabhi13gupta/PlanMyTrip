import type { Activity, Trip } from '../types'
import { todayISO } from './dates'

/** Within a day: timed activities first in time order, then untimed in the order they were added. */
export function sortActivities(activities: Activity[]): Activity[] {
  return [...activities].sort((a, b) => {
    if (a.time && b.time && a.time !== b.time) return a.time < b.time ? -1 : 1
    if (a.time && !b.time) return -1
    if (!a.time && b.time) return 1
    return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0
  })
}

/** How many activities sit on days after `newDuration` (they'd be deleted by shortening). */
export function countActivitiesBeyondDay(activities: Activity[], newDuration: number): number {
  return activities.filter((a) => a.dayNumber > newDuration).length
}

export function activitiesForDay(activities: Activity[], dayNumber: number): Activity[] {
  return sortActivities(activities.filter((a) => a.dayNumber === dayNumber))
}

/**
 * My Trips order (frontend-spec.md §4.3): upcoming and current trips first, soonest first;
 * then past trips, most recent first.
 */
export function sortTripsForHome<T extends Trip>(trips: T[], today: string = todayISO()) {
  const current = trips.filter((t) => t.endDate >= today).sort((a, b) => cmp(a.startDate, b.startDate))
  const past = trips.filter((t) => t.endDate < today).sort((a, b) => cmp(b.startDate, a.startDate))
  return { current, past }
}

function cmp(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}
