import type { ActivityInput, IdeaPlace, TripType } from '../types'

export type IdeaIcon =
  | 'sights' | 'museum' | 'park' | 'food' | 'cafe' | 'walk' | 'view' | 'market'
  | 'heart' | 'wine' | 'kid' | 'fish' | 'play' | 'night' | 'group' | 'bulb'

export interface IdeaCategory {
  /** Sent to the API as `?category=` (api-contract-spec.md §6.13), e.g. "museums". */
  id: string
  /** Shown on the tab, e.g. "Museums". */
  label: string
  /** The words searched before " in <destination>", for the Google Maps fallback link. */
  search: string
  icon: IdeaIcon
  /** True for the tabs picked by the Trip Type (shaded differently). */
  byTripType: boolean
}

type CategorySeed = Omit<IdeaCategory, 'byTripType'>

// The category table in frontend-spec.md §4.5.1 (the backend has the same ids).
const COMMON: CategorySeed[] = [
  { id: 'top-sights', label: 'Top sights', search: 'top attractions', icon: 'sights' },
  { id: 'museums', label: 'Museums', search: 'museums', icon: 'museum' },
  { id: 'parks', label: 'Parks', search: 'parks and gardens', icon: 'park' },
  { id: 'restaurants', label: 'Restaurants', search: 'restaurants', icon: 'food' },
  { id: 'cafes', label: 'Cafés', search: 'cafes', icon: 'cafe' },
]

const BY_TRIP_TYPE: Record<TripType, CategorySeed[]> = {
  solo: [
    { id: 'walking-tours', label: 'Walking tours', search: 'walking tours', icon: 'walk' },
    { id: 'viewpoints', label: 'Viewpoints', search: 'viewpoints', icon: 'view' },
    { id: 'markets', label: 'Markets', search: 'markets', icon: 'market' },
  ],
  couple: [
    { id: 'romantic-dinner', label: 'Romantic dinner', search: 'romantic restaurants', icon: 'heart' },
    { id: 'viewpoints', label: 'Viewpoints', search: 'viewpoints', icon: 'view' },
    { id: 'wine-bars', label: 'Wine bars', search: 'wine bars', icon: 'wine' },
  ],
  family: [
    { id: 'kid-friendly', label: 'Kid-friendly', search: 'kid friendly activities', icon: 'kid' },
    { id: 'zoos-aquariums', label: 'Zoos & aquariums', search: 'zoo aquarium', icon: 'fish' },
    { id: 'playgrounds', label: 'Playgrounds', search: 'playgrounds', icon: 'play' },
  ],
  friends: [
    { id: 'nightlife', label: 'Nightlife', search: 'nightlife', icon: 'night' },
    { id: 'food-markets', label: 'Food markets', search: 'food markets', icon: 'market' },
    { id: 'group-activities', label: 'Group activities', search: 'group activities', icon: 'group' },
  ],
}

/** The five categories every trip gets, then the three picked by its Trip Type. */
export function ideasForTripType(tripType: TripType): IdeaCategory[] {
  return [
    ...COMMON.map((category) => ({ ...category, byTripType: false })),
    ...BY_TRIP_TYPE[tripType].map((category) => ({ ...category, byTripType: true })),
  ]
}

/** The activity an idea becomes: its name as the title, its address as the notes, no time. */
export function ideaToActivity(idea: IdeaPlace): ActivityInput {
  return {
    title: idea.name.slice(0, 100),
    time: null,
    notes: idea.address ? idea.address.slice(0, 500) : null,
  }
}

/** Review counts as Google shows them: 310, 1.5k, 98k. */
export function shortCount(n: number): string {
  if (n < 1000) return String(n)
  if (n < 10000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return `${Math.round(n / 1000)}k`
}
