// Weather on each day (frontend-spec.md §4.5.3, US12), from Open-Meteo: free for non-commercial
// use, no key, called straight from the browser. Weather is extra, so every failure means
// "no weather", never an error on screen.
import { addDays, format } from 'date-fns'
import { parseDate, todayISO } from './dates'

/** Open-Meteo forecasts today plus the next 15 days. */
export const FORECAST_DAYS = 16

export type TemperatureUnit = 'celsius' | 'fahrenheit'

export interface Place {
  name: string
  latitude: number
  longitude: number
  country?: string
  country_code?: string
  admin1?: string
}

export interface DayForecast {
  date: string
  code: number
  high: number
  low: number
  /** Chance of rain in %, or null if Open-Meteo doesn't say. */
  rainChance: number | null
}

/** °F for US English browsers, °C everywhere else. */
export function temperatureUnit(language: string = navigator.language): TemperatureUnit {
  return language.toLowerCase() === 'en-us' ? 'fahrenheit' : 'celsius'
}

/** The part searched for: "Paris" from "Paris, France". */
export function placeQuery(destination: string): string {
  return destination.split(',')[0].trim()
}

/**
 * The best match for a destination: the first result whose country, country code, or region
 * matches a later part of it ("Paris, Texas"), else the first result.
 */
export function pickPlace(destination: string, results: Place[]): Place | null {
  const hints = destination
    .split(',')
    .slice(1)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
  const matches = (place: Place) =>
    [place.country, place.country_code, place.admin1].some(
      (value) => value !== undefined && hints.includes(value.toLowerCase()),
    )
  return results.find(matches) ?? results[0] ?? null
}

/** The trip's days Open-Meteo can forecast (today … today + 15), or null if none. */
export function forecastRange(
  startDate: string,
  endDate: string,
  today: string = todayISO(),
): { start: string; end: string } | null {
  const lastForecastDay = format(addDays(parseDate(today), FORECAST_DAYS - 1), 'yyyy-MM-dd')
  const start = startDate > today ? startDate : today
  const end = endDate < lastForecastDay ? endDate : lastForecastDay
  return start <= end ? { start, end } : null
}

/** True for a day too far ahead to forecast yet ("Forecast closer to the date"). */
export function isBeyondForecast(date: string, today: string = todayISO()): boolean {
  return date > format(addDays(parseDate(today), FORECAST_DAYS - 1), 'yyyy-MM-dd')
}

/** WMO weather code → emoji and words (the table in §4.5.3). */
export function weatherLabel(code: number): { icon: string; label: string } {
  if (code === 0) return { icon: '☀️', label: 'Clear' }
  if (code === 1) return { icon: '🌤️', label: 'Mostly clear' }
  if (code === 2) return { icon: '⛅', label: 'Partly cloudy' }
  if (code === 3) return { icon: '☁️', label: 'Cloudy' }
  if (code === 45 || code === 48) return { icon: '🌫️', label: 'Fog' }
  if (code >= 51 && code <= 57) return { icon: '🌦️', label: 'Drizzle' }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { icon: '🌧️', label: 'Rain' }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { icon: '🌨️', label: 'Snow' }
  if (code >= 95 && code <= 99) return { icon: '⛈️', label: 'Thunderstorm' }
  return { icon: '🌡️', label: 'Weather' }
}

export async function findPlace(destination: string): Promise<Place | null> {
  const url =
    'https://geocoding-api.open-meteo.com/v1/search?' +
    new URLSearchParams({ name: placeQuery(destination), count: '10', language: 'en', format: 'json' })
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Geocoding failed: ${response.status}`)
  const data = (await response.json()) as { results?: Place[] }
  return pickPlace(destination, data.results ?? [])
}

export async function fetchForecast(
  place: Place,
  range: { start: string; end: string },
  unit: TemperatureUnit,
): Promise<DayForecast[]> {
  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    start_date: range.start,
    end_date: range.end,
  })
  if (unit === 'fahrenheit') params.set('temperature_unit', 'fahrenheit')
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
  if (!response.ok) throw new Error(`Forecast failed: ${response.status}`)
  const { daily } = (await response.json()) as {
    daily?: {
      time: string[]
      weather_code: (number | null)[]
      temperature_2m_max: (number | null)[]
      temperature_2m_min: (number | null)[]
      precipitation_probability_max?: (number | null)[]
    }
  }
  if (!daily) return []
  return daily.time.flatMap((date, i) => {
    const code = daily.weather_code[i]
    const high = daily.temperature_2m_max[i]
    const low = daily.temperature_2m_min[i]
    if (code == null || high == null || low == null) return []
    return [{ date, code, high, low, rainChance: daily.precipitation_probability_max?.[i] ?? null }]
  })
}
