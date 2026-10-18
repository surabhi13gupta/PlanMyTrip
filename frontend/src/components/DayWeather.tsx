import { isBeyondForecast, weatherLabel, type DayForecast } from '../lib/weather'

/**
 * A day's forecast in its heading row: "☀️ 24° / 15° 💧 40%", or "Forecast closer to the date"
 * for days too far ahead (frontend-spec.md §4.5.3). Nothing for past days or when there's no data.
 */
export function DayWeather({ date, forecast }: { date: string; forecast?: DayForecast }) {
  if (!forecast) {
    return isBeyondForecast(date) ? (
      <span className="text-xs text-muted">Forecast closer to the date</span>
    ) : null
  }
  const { icon, label } = weatherLabel(forecast.code)
  const high = Math.round(forecast.high)
  const low = Math.round(forecast.low)
  const rain = forecast.rainChance !== null && forecast.rainChance >= 30 ? forecast.rainChance : null
  const spoken =
    `Forecast: ${label.toLowerCase()}, high ${high}°, low ${low}°` +
    (rain !== null ? `, ${rain}% chance of rain` : '')

  return (
    <span className="inline-flex items-center gap-2 text-sm whitespace-nowrap tabular-nums" title={label}>
      <span className="sr-only">{spoken}</span>
      <span aria-hidden="true" className="inline-flex items-center gap-1.5">
        <span className="text-base leading-none">{icon}</span>
        <span>
          <span className="font-medium text-ink">{high}°</span>
          <span className="text-muted"> / {low}°</span>
        </span>
        {rain !== null && <span className="text-primary">💧 {rain}%</span>}
      </span>
    </span>
  )
}

/** The credit Open-Meteo's free plan asks for, shown when any day has a forecast. */
export function WeatherCredit() {
  return (
    <p className="-mt-2 text-xs text-muted">
      Weather by{' '}
      <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-primary">
        Open-Meteo
      </a>
    </p>
  )
}
