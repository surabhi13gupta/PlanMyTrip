import type { TripType } from '../types'

export type IdeaIcon =
  | 'sights' | 'museum' | 'park' | 'food' | 'cafe' | 'walk' | 'view' | 'market'
  | 'heart' | 'wine' | 'kid' | 'fish' | 'play' | 'night' | 'group'

export interface Idea {
  /** Shown on the chip, e.g. "Museums". */
  label: string
  /** Sent to Google Maps before " in <destination>", e.g. "museums". */
  search: string
  icon: IdeaIcon
  /** True for the chips picked by the Trip Type (shaded differently). */
  byTripType: boolean
}

type IdeaSeed = Omit<Idea, 'byTripType'>

// The chip table in frontend-spec.md §4.5.1.
const COMMON: IdeaSeed[] = [
  { label: 'Top sights', search: 'top attractions', icon: 'sights' },
  { label: 'Museums', search: 'museums', icon: 'museum' },
  { label: 'Parks', search: 'parks and gardens', icon: 'park' },
  { label: 'Restaurants', search: 'restaurants', icon: 'food' },
  { label: 'Cafés', search: 'cafes', icon: 'cafe' },
]

const BY_TRIP_TYPE: Record<TripType, IdeaSeed[]> = {
  solo: [
    { label: 'Walking tours', search: 'walking tours', icon: 'walk' },
    { label: 'Viewpoints', search: 'viewpoints', icon: 'view' },
    { label: 'Markets', search: 'markets', icon: 'market' },
  ],
  couple: [
    { label: 'Romantic dinner', search: 'romantic restaurants', icon: 'heart' },
    { label: 'Viewpoints', search: 'viewpoints', icon: 'view' },
    { label: 'Wine bars', search: 'wine bars', icon: 'wine' },
  ],
  family: [
    { label: 'Kid-friendly', search: 'kid friendly activities', icon: 'kid' },
    { label: 'Zoos & aquariums', search: 'zoo aquarium', icon: 'fish' },
    { label: 'Playgrounds', search: 'playgrounds', icon: 'play' },
  ],
  friends: [
    { label: 'Nightlife', search: 'nightlife', icon: 'night' },
    { label: 'Food markets', search: 'food markets', icon: 'market' },
    { label: 'Group activities', search: 'group activities', icon: 'group' },
  ],
}

/** The five chips every trip gets, then the three picked by its Trip Type. */
export function ideasForTripType(tripType: TripType): Idea[] {
  return [
    ...COMMON.map((idea) => ({ ...idea, byTripType: false })),
    ...BY_TRIP_TYPE[tripType].map((idea) => ({ ...idea, byTripType: true })),
  ]
}
