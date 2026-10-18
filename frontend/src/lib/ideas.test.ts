import { TRIP_TYPES } from '../types'
import { ideasForTripType } from './ideas'

describe('ideasForTripType', () => {
  it('gives every trip the same five chips first', () => {
    for (const { value } of TRIP_TYPES) {
      const ideas = ideasForTripType(value)
      expect(ideas).toHaveLength(8)
      expect(ideas.slice(0, 5).map((i) => i.label)).toEqual(['Top sights', 'Museums', 'Parks', 'Restaurants', 'Cafés'])
      expect(ideas.slice(0, 5).every((i) => !i.byTripType)).toBe(true)
      expect(ideas.slice(5).every((i) => i.byTripType)).toBe(true)
    }
  })

  it('picks three chips by Trip Type', () => {
    const labels = (type: Parameters<typeof ideasForTripType>[0]) =>
      ideasForTripType(type).slice(5).map((i) => i.label)
    expect(labels('solo')).toEqual(['Walking tours', 'Viewpoints', 'Markets'])
    expect(labels('couple')).toEqual(['Romantic dinner', 'Viewpoints', 'Wine bars'])
    expect(labels('family')).toEqual(['Kid-friendly', 'Zoos & aquariums', 'Playgrounds'])
    expect(labels('friends')).toEqual(['Nightlife', 'Food markets', 'Group activities'])
  })
})
