import { mapsSearchUrl } from '../lib/maps'
import { PinIcon } from './Icons'

/** A small "Map" link that opens a Google Maps search in a new tab (frontend-spec.md §4.5.2). */
export function MapLink({ query, label }: { query: string; label: string }) {
  return (
    <a
      href={mapsSearchUrl(query)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${label} on Google Maps (opens in a new tab)`}
      className={
        '-ml-1 inline-flex min-h-8 items-center gap-1 justify-self-start rounded-md pr-2 pl-1 text-sm font-medium ' +
        'text-primary transition-colors hover:bg-primary-soft hover:underline hover:underline-offset-3 ' +
        'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary'
      }
    >
      <PinIcon />
      Map
    </a>
  )
}
