// Shapes from api-contract-spec.md §3. Dates are 'YYYY-MM-DD'; times are 'HH:mm'.

export type TripType = 'solo' | 'couple' | 'family' | 'friends'

export const TRIP_TYPES: { value: TripType; label: string }[] = [
  { value: 'solo', label: 'Solo' },
  { value: 'couple', label: 'Couple' },
  { value: 'family', label: 'Family' },
  { value: 'friends', label: 'Friends' },
]

export interface User {
  id: string
  username: string
  createdAt: string
}

export interface Trip {
  id: string
  destination: string
  startDate: string
  endDate: string
  tripType: TripType
  durationDays: number
  createdAt: string
  updatedAt: string
}

export interface Activity {
  id: string
  dayNumber: number
  title: string
  time: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface TripDetail extends Trip {
  activities: Activity[]
}

export interface TripInput {
  destination: string
  startDate: string
  endDate: string
  tripType: TripType
}

export interface ActivityInput {
  title: string
  time: string | null
  notes: string | null
}

export interface TripDay {
  dayNumber: number
  date: string
}
