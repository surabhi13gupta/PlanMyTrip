import { forecastRange, isBeyondForecast, pickPlace, placeQuery, temperatureUnit, weatherLabel, type Place } from './weather'

const paris = (overrides: Partial<Place>): Place => ({ name: 'Paris', latitude: 0, longitude: 0, ...overrides })

describe('pickPlace', () => {
  const results = [
    paris({ country: 'France', country_code: 'FR', admin1: 'Île-de-France', latitude: 48.85 }),
    paris({ country: 'United States', country_code: 'US', admin1: 'Texas', latitude: 33.66 }),
  ]

  it('searches for the part before the first comma', () => {
    expect(placeQuery('Paris, Texas')).toBe('Paris')
    expect(placeQuery('  Kyoto ')).toBe('Kyoto')
  })

  it('prefers the result whose region, country, or code matches the rest of the destination', () => {
    expect(pickPlace('Paris, Texas', results)?.latitude).toBe(33.66)
    expect(pickPlace('Paris, us', results)?.latitude).toBe(33.66)
    expect(pickPlace('Paris, France', results)?.latitude).toBe(48.85)
  })

  it('falls back to the first result, or null when there are none', () => {
    expect(pickPlace('Paris', results)?.latitude).toBe(48.85)
    expect(pickPlace('Nowhere', [])).toBeNull()
  })
})

describe('forecastRange', () => {
  const today = '2026-10-18'

  it('clips the trip to today … today + 15', () => {
    expect(forecastRange('2026-10-16', '2026-10-20', today)).toEqual({ start: '2026-10-18', end: '2026-10-20' })
    expect(forecastRange('2026-10-30', '2026-11-08', today)).toEqual({ start: '2026-10-30', end: '2026-11-02' })
  })

  it('is null when no day can be forecast', () => {
    expect(forecastRange('2026-10-01', '2026-10-05', today)).toBeNull()
    expect(forecastRange('2026-11-03', '2026-11-05', today)).toBeNull()
  })

  it('knows which days are too far ahead', () => {
    expect(isBeyondForecast('2026-11-02', today)).toBe(false)
    expect(isBeyondForecast('2026-11-03', today)).toBe(true)
  })
})

describe('weatherLabel and temperatureUnit', () => {
  it('maps WMO codes to an icon and words', () => {
    expect(weatherLabel(0)).toEqual({ icon: '☀️', label: 'Clear' })
    expect(weatherLabel(63).label).toBe('Rain')
    expect(weatherLabel(81).label).toBe('Rain')
    expect(weatherLabel(75).label).toBe('Snow')
    expect(weatherLabel(95).label).toBe('Thunderstorm')
  })

  it('uses °F only for US English', () => {
    expect(temperatureUnit('en-US')).toBe('fahrenheit')
    expect(temperatureUnit('en-GB')).toBe('celsius')
    expect(temperatureUnit('fr-FR')).toBe('celsius')
  })
})
