import { TRIP_TYPES } from '../types'
import { ideasForTripType, ideaToActivity, shortCount } from './ideas'

describe('ideasForTripType', () => {
  it('gives every trip the same five categories first', () => {
    for (const { value } of TRIP_TYPES) {
      const ideas = ideasForTripType(value)
      expect(ideas).toHaveLength(8)
      expect(ideas.slice(0, 5).map((i) => i.label)).toEqual(['Top sights', 'Museums', 'Parks', 'Restaurants', 'Cafés'])
      expect(ideas.slice(0, 5).every((i) => !i.byTripType)).toBe(true)
      expect(ideas.slice(5).every((i) => i.byTripType)).toBe(true)
    }
  })

  it('picks three categories by Trip Type', () => {
    const labels = (type: Parameters<typeof ideasForTripType>[0]) =>
      ideasForTripType(type).slice(5).map((i) => i.label)
    expect(labels('solo')).toEqual(['Walking tours', 'Viewpoints', 'Markets'])
    expect(labels('couple')).toEqual(['Romantic dinner', 'Viewpoints', 'Wine bars'])
    expect(labels('family')).toEqual(['Kid-friendly', 'Zoos & aquariums', 'Playgrounds'])
    expect(labels('friends')).toEqual(['Nightlife', 'Food markets', 'Group activities'])
  })
})

describe('ideaToActivity', () => {
  const idea = {
    id: 'p1', name: 'x'.repeat(120), rating: null, reviews: null, priceLevel: null, type: null,
    address: 'y'.repeat(600), thumbnailUrl: null,
  }

  it('uses the name as the title and the address as the notes, cut to their limits, with no time', () => {
    const activity = ideaToActivity(idea)
    expect(activity.title).toHaveLength(100)
    expect(activity.notes).toHaveLength(500)
    expect(activity.time).toBeNull()
  })

  it('leaves the notes empty when there is no address', () => {
    expect(ideaToActivity({ ...idea, address: null }).notes).toBeNull()
  })
})

describe('shortCount', () => {
  it('shortens review counts the way Google shows them', () => {
    expect(shortCount(310)).toBe('310')
    expect(shortCount(1000)).toBe('1k')
    expect(shortCount(1500)).toBe('1.5k')
    expect(shortCount(98214)).toBe('98k')
  })
})
