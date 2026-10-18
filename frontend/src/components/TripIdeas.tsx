import type { ReactNode } from 'react'
import { ideasForTripType, type IdeaIcon } from '../lib/ideas'
import { mapsSearchUrl } from '../lib/maps'
import type { TripType } from '../types'
import { ExternalLinkIcon } from './Icons'
import { cardClass } from './ui'

/** The section the empty-day hint links to. */
export const IDEAS_SECTION_ID = 'ideas'

/** "Ideas for <destination>": chips that open Google Maps searches (frontend-spec.md §4.5.1, US8). */
export function TripIdeas({ destination, tripType }: { destination: string; tripType: TripType }) {
  return (
    <section
      id={IDEAS_SECTION_ID}
      aria-labelledby="ideas-heading"
      className={`${cardClass} grid scroll-mt-24 gap-3 px-[18px] pt-3.5 pb-4`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h2 id="ideas-heading" className="min-w-0 text-lg font-semibold break-words text-primary">
          Ideas for {destination}
        </h2>
        <span className="text-sm text-muted">Opens Google Maps in a new tab</span>
      </div>
      <ul className="flex flex-wrap gap-2">
        {ideasForTripType(tripType).map((idea) => (
          <li key={idea.label}>
            <a
              href={mapsSearchUrl(`${idea.search} in ${destination}`)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${idea.label} in ${destination}, on Google Maps (opens in a new tab)`}
              className={
                'inline-flex min-h-10 items-center gap-1.5 rounded-full border pr-3.5 pl-2.5 text-[0.9rem] font-medium ' +
                'text-primary transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 ' +
                'focus-visible:outline-primary ' +
                (idea.byTripType
                  ? 'border-transparent bg-primary-soft hover:border-primary'
                  : 'border-primary bg-surface hover:bg-primary-soft')
              }
            >
              <IdeaGlyph icon={idea.icon} />
              {idea.label}
              <span className="opacity-60">
                <ExternalLinkIcon />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

// Small line icons for the chips; decorative (the link's label names the idea).
const GLYPHS: Record<IdeaIcon, ReactNode> = {
  sights: <path d="M10 2.5l2.2 4.6 5 .6-3.7 3.4 1 5-4.5-2.5-4.5 2.5 1-5L2.8 7.7l5-.6z" />,
  museum: <path d="M3 8h14L10 3.5zM4.5 8v7M8 8v7M12 8v7M15.5 8v7M3 16.5h14" />,
  park: <path d="M10 17v-5M10 12c-3.5 0-5-2-5-4.5S7.2 3 10 3s5 2 5 4.5S13.5 12 10 12z" />,
  food: <path d="M6 2.5v6M4 2.5v4a2 2 0 0 0 4 0v-4M6 8.5v9M14 17.5V2.5c-2 1-3 3.5-3 6.5h3" />,
  cafe: <path d="M3.5 8h10v4a4 4 0 0 1-4 4h-2a4 4 0 0 1-4-4zM13.5 9h1.5a2 2 0 0 1 0 4h-1.7M7 2.5v3M10 2.5v3" />,
  walk: (
    <>
      <circle cx="11" cy="3.5" r="1.6" fill="currentColor" stroke="none" />
      <path d="M8 18l2-5 2 2v3M10 13l1-5-3 1.5L7 12M11 8l2 3h2.5" />
    </>
  ),
  view: (
    <>
      <path d="M2 16l5-8 3 4 2.5-3L18 16z" />
      <circle cx="14.5" cy="4.5" r="1.5" />
    </>
  ),
  market: <path d="M3 8l1.5-4.5h11L17 8M3 8h14M3 8a2.3 2.3 0 0 0 4.7 0 2.3 2.3 0 0 0 4.6 0A2.3 2.3 0 0 0 17 8M4.5 10.5v6h11v-6" />,
  heart: <path d="M10 16.5S3 12.4 3 7.6A3.6 3.6 0 0 1 10 6a3.6 3.6 0 0 1 7 1.6c0 4.8-7 8.9-7 8.9z" />,
  wine: <path d="M6.5 2.5h7c0 4-1.2 6.5-3.5 6.5S6.5 6.5 6.5 2.5zM10 9v8M7 17.5h6" />,
  kid: (
    <>
      <circle cx="10" cy="5" r="2.3" />
      <path d="M5 10.5l5-1.5 5 1.5M10 9v4l-2.5 4.5M10 13l2.5 4.5" />
    </>
  ),
  fish: (
    <>
      <path d="M2.5 10c2.5-3.5 7.5-4.5 11-1.5L17.5 6v8l-4-2.5c-3.5 3-8.5 2-11-1.5z" />
      <circle cx="7" cy="9.5" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  play: <path d="M3 17.5V6l4-3 4 3v11.5M11 10l6 7.5M3 11h8" />,
  night: <path d="M15.5 12.5A6.5 6.5 0 0 1 7.5 4.5a6.5 6.5 0 1 0 8 8z" />,
  group: (
    <>
      <circle cx="7" cy="6.5" r="2.3" />
      <circle cx="13.5" cy="7.5" r="1.9" />
      <path d="M2.5 16c.5-3 2.3-4.5 4.5-4.5s4 1.5 4.5 4.5M11.5 12.3c.6-.4 1.3-.6 2-.6 1.9 0 3.4 1.3 3.9 4.3" />
    </>
  ),
}

function IdeaGlyph({ icon }: { icon: IdeaIcon }) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {GLYPHS[icon]}
    </svg>
  )
}
