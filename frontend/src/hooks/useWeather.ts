import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  fetchForecast,
  findPlace,
  forecastRange,
  type DayForecast,
} from '../lib/weather'

/**
 * The forecast for each of a trip's days that Open-Meteo covers, by date (frontend-spec.md §4.5.3).
 * Empty while loading or if anything fails: weather never shows an error.
 */
export function useTripWeather(destination: string, startDate: string, endDate: string) {
  const range = forecastRange(startDate, endDate)

  const place = useQuery({
    queryKey: ['geocode', destination],
    queryFn: () => findPlace(destination),
    enabled: range !== null,
    staleTime: Infinity,
    retry: false,
  })
  const forecast = useQuery({
    queryKey: ['weather', destination, range?.start, range?.end],
    queryFn: () => fetchForecast(place.data!, range!),
    enabled: range !== null && !!place.data,
    staleTime: 60 * 60 * 1000,
    retry: false,
  })

  return useMemo(() => {
    const byDate = new Map<string, DayForecast>()
    for (const day of forecast.data ?? []) byDate.set(day.date, day)
    return byDate
  }, [forecast.data])
}
