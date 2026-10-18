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
  /** As typed at signup, or null if they didn't give one. */
  name: string | null
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

/** One place in the Ideas panel (api-contract-spec.md §6.13). */
export interface IdeaPlace {
  id: string
  name: string
  rating: number | null
  reviews: number | null
  priceLevel: string | null
  type: string | null
  address: string | null
  thumbnailUrl: string | null
}

export interface IdeasResponse {
  category: string
  query: string
  fetchedAt: string
  ideas: IdeaPlace[]
}
