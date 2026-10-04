// Trip dates are calendar dates with no time zone ('YYYY-MM-DD'). They are parsed as local
// midnight and only ever compared or formatted as dates, never shifted through UTC.
import { addDays, differenceInCalendarDays, format, parse } from 'date-fns'
import type { TripDay } from '../types'

export const MAX_TRIP_DAYS = 14

export function parseDate(value: string): Date {
  return parse(value, 'yyyy-MM-dd', new Date())
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function isValidISODate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(parseDate(value).getTime())
}

/** The user's local date. */
export function todayISO(now: Date = new Date()): string {
  return toISODate(now)
}

/** Number of days counting both the start and end dates (Oct 10 → Oct 12 is 3 days). */
export function getTripDuration(startDate: string, endDate: string): number {
  return differenceInCalendarDays(parseDate(endDate), parseDate(startDate)) + 1
}

/** Day 1 … Day N with their calendar dates, worked out from the trip's dates. */
export function getTripDays(startDate: string, endDate: string): TripDay[] {
  const start = parseDate(startDate)
  const count = Math.max(0, getTripDuration(startDate, endDate))
  return Array.from({ length: count }, (_, i) => ({
    dayNumber: i + 1,
    date: toISODate(addDays(start, i)),
  }))
}

/** "Sat, Oct 11" */
export function formatDayLabel(date: string): string {
  return format(parseDate(date), 'EEE, MMM d')
}

/** "Oct 11" */
export function formatShortDate(date: string): string {
  return format(parseDate(date), 'MMM d')
}

/** "Oct 10 – Oct 14, 2026", or "Dec 28, 2026 – Jan 6, 2027" across years. */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`
  }
  return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`
}

/** "From Oct 10 → To Oct 14, 2026" (the trip page header). */
export function formatFromTo(startDate: string, endDate: string): string {
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  const startFormat = start.getFullYear() === end.getFullYear() ? 'MMM d' : 'MMM d, yyyy'
  return `From ${format(start, startFormat)} → To ${format(end, 'MMM d, yyyy')}`
}

export function formatDuration(days: number): string {
  return `${days} ${days === 1 ? 'day' : 'days'}`
}
