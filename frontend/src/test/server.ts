// MSW stands in for the backend in component tests (frontend-spec.md §14).
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import type { Activity, TripDetail } from '../types'

export const server = setupServer()
export { http, HttpResponse }

// Matches the API on any origin (the app calls relative /api/v1 URLs).
export const API = '*/api/v1'

export function makeActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: crypto.randomUUID(),
    dayNumber: 1,
    title: 'Activity',
    time: null,
    notes: null,
    createdAt: '2026-10-04T10:00:00Z',
    updatedAt: '2026-10-04T10:00:00Z',
    ...overrides,
  }
}

export function makeTrip(overrides: Partial<TripDetail> = {}): TripDetail {
  return {
    id: 'trip-1',
    destination: 'Paris, France',
    startDate: '2026-10-10',
    endDate: '2026-10-14',
    tripType: 'couple',
    durationDays: 5,
    createdAt: '2026-10-04T10:00:00Z',
    updatedAt: '2026-10-04T10:00:00Z',
    activities: [],
    ...overrides,
  }
}
