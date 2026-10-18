import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { BackLink } from '../components/BackLink'
import { PinIcon } from '../components/Icons'
import { IdeaGlyph } from '../components/IdeaGlyph'
import { UserMenu } from '../components/Layouts'
import { SiteBanner } from '../components/SiteBanner'
import { SiteFooter } from '../components/SiteFooter'
import { buttonClass, cardClass } from '../components/ui'
import { useAuth } from '../hooks/useAuth'

const FEATURES: { icon: ReactNode; title: string; line: string }[] = [
  { icon: <CalendarIcon />, title: 'Day by day', line: 'Up to 14 days, with times and notes.' },
  { icon: <IdeaGlyph icon="bulb" size={20} />, title: 'Ideas built in', line: 'Top sights, food and more, added in a tap.' },
  { icon: <PinIcon />, title: 'On the map', line: 'Open any stop in Google Maps.' },
  { icon: <DocumentIcon />, title: 'Ready to go', line: 'Download your plan as a PDF.' },
]

const PILLS = ['Free', 'No ads', 'Private to you']

/** What PlanMyTrip does, short and visual, for everyone (frontend-spec.md §4.8, US10). */
export default function AboutPage() {
  const { user } = useAuth()
  return (
    <div className="min-h-dvh">
      <SiteBanner>{user && <UserMenu />}</SiteBanner>
      <main className="mx-auto grid w-full max-w-xl gap-6 px-4 pt-6 pb-12 md:px-6">
        <BackLink>Back</BackLink>

        <div className="grid gap-2">
          <p className="text-xs font-medium tracking-[0.08em] text-muted uppercase">About PlanMyTrip</p>
          <h1 className="text-3xl leading-tight font-semibold text-balance text-primary">
            Plan your trip, one day at a time
          </h1>
          <p className="text-lg text-muted">Build a day-by-day plan, find things to do, and take it with you.</p>
        </div>

        <ul className="grid grid-cols-2 gap-3">
          {FEATURES.map((feature) => (
            <li key={feature.title} className={`${cardClass} grid content-start gap-2 p-4`}>
              <span aria-hidden="true" className="grid size-10 place-items-center rounded-full bg-primary-soft text-primary">
                {feature.icon}
              </span>
              <h2 className="font-semibold text-primary">{feature.title}</h2>
              <p className="text-sm text-muted">{feature.line}</p>
            </li>
          ))}
        </ul>

        <ul className="flex flex-wrap gap-2" aria-label="Good to know">
          {PILLS.map((pill) => (
            <li
              key={pill}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-sm font-medium text-ink"
            >
              <CheckIcon />
              {pill}
            </li>
          ))}
        </ul>

        <div className="grid justify-items-start gap-3">
          {user ? (
            <Link to="/trips" className={buttonClass.primary}>
              Go to My Trips
            </Link>
          ) : (
            <Link to="/signup" className={buttonClass.primary}>
              Create a free account
            </Link>
          )}
          <p className="text-xs text-muted">Ideas come from Google Maps, via SerpApi.</p>
        </div>

        <SiteFooter />
      </main>
    </div>
  )
}

const iconProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

function CalendarIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="4.5" width="14" height="12.5" rx="2" />
      <path d="M3 8.5h14M7 2.5v4M13 2.5v4M7 12h2" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5 2.5h6.5L15 6v11.5H5z" />
      <path d="M11.5 2.5V6H15M10 9v5.5M7.5 12l2.5 2.5 2.5-2.5" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg {...iconProps} width={14} height={14} strokeWidth={2.2} className="text-success">
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  )
}
