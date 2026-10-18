import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'

const backClass =
  'group -ml-1 inline-flex min-h-11 items-center gap-1.5 justify-self-start rounded-lg pr-2 pl-1 ' +
  'text-[0.9375rem] font-medium text-primary transition-colors hover:bg-primary-soft ' +
  'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary'

/**
 * "← My Trips", "← Back to trip", or "← Back" at the top left of an inner page
 * (frontend-spec.md §4.9, US11). With `to` it's a link to that page; without it, it goes back
 * in the browser history, or to the start page when there's nothing in the app to go back to.
 */
export function BackLink({ to, children }: { to?: string; children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const content = (
    <>
      <ArrowLeftIcon />
      {children}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={backClass}>
        {content}
      </Link>
    )
  }
  return (
    <button
      type="button"
      className={backClass}
      // "default" is the key of the first page loaded in this tab: there's no app page behind it.
      onClick={() => (location.key === 'default' ? navigate('/') : navigate(-1))}
    >
      {content}
    </button>
  )
}

function ArrowLeftIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none"
    >
      <path d="M16 10H4M9 5l-5 5 5 5" />
    </svg>
  )
}
