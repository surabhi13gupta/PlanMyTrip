import { makeActivity, makeTrip } from '../test/server'
import { activitiesForDay, countActivitiesBeyondDay, sortActivities, sortTripsForHome } from './activities'
import { itineraryFileName } from './itineraryFileName'

describe('sortActivities', () => {
  it('puts timed activities first by time, then untimed in the order they were added', () => {
    const items = [
      makeActivity({ title: 'Walk', createdAt: '2026-10-04T10:00:00Z' }),
      makeActivity({ title: 'Dinner', time: '19:30', createdAt: '2026-10-04T10:01:00Z' }),
      makeActivity({ title: 'Postcards', createdAt: '2026-10-04T10:03:00Z' }),
      makeActivity({ title: 'Louvre', time: '09:00', createdAt: '2026-10-04T10:02:00Z' }),
    ]
    expect(sortActivities(items).map((a) => a.title)).toEqual(['Louvre', 'Dinner', 'Walk', 'Postcards'])
  })

  it('does not change the original array', () => {
    const items = [makeActivity({ title: 'B', time: '10:00' }), makeActivity({ title: 'A', time: '09:00' })]
    sortActivities(items)
    expect(items[0].title).toBe('B')
  })
})

describe('countActivitiesBeyondDay', () => {
  const items = [1, 2, 4, 5, 5].map((dayNumber) => makeActivity({ dayNumber }))

  it('counts activities on days that shortening would remove', () => {
    expect(countActivitiesBeyondDay(items, 3)).toBe(3) // 5 days → 3 removes Days 4–5
    expect(countActivitiesBeyondDay(items, 5)).toBe(0) // same length: nothing removed
  })
})

describe('activitiesForDay', () => {
  it('returns only that day, sorted', () => {
    const items = [
      makeActivity({ dayNumber: 2, title: 'Late', time: '20:00' }),
      makeActivity({ dayNumber: 1, title: 'Other day' }),
      makeActivity({ dayNumber: 2, title: 'Early', time: '08:00' }),
    ]
    expect(activitiesForDay(items, 2).map((a) => a.title)).toEqual(['Early', 'Late'])
  })
})

describe('sortTripsForHome', () => {
  it('shows upcoming and current trips soonest first, then past trips most recent first', () => {
    const trips = [
      makeTrip({ id: 'past-old', startDate: '2026-01-01', endDate: '2026-01-03' }),
      makeTrip({ id: 'later', startDate: '2026-12-01', endDate: '2026-12-03' }),
      makeTrip({ id: 'current', startDate: '2026-10-01', endDate: '2026-10-06' }),
      makeTrip({ id: 'past-recent', startDate: '2026-09-01', endDate: '2026-09-03' }),
    ]
    const { current, past } = sortTripsForHome(trips, '2026-10-04')
    expect(current.map((t) => t.id)).toEqual(['current', 'later'])
    expect(past.map((t) => t.id)).toEqual(['past-recent', 'past-old'])
  })
})

describe('itineraryFileName', () => {
  it('builds <Destination>-<start date>-itinerary.pdf', () => {
    expect(itineraryFileName('Paris, France', '2026-10-10')).toBe('Paris-France-2026-10-10-itinerary.pdf')
    expect(itineraryFileName('Montréal, Québec', '2026-10-10')).toBe('Montreal-Quebec-2026-10-10-itinerary.pdf')
    expect(itineraryFileName('!!!', '2026-10-10')).toBe('trip-2026-10-10-itinerary.pdf')
  })
})
