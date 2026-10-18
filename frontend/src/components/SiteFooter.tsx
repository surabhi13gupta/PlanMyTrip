import { Link } from 'react-router'
import { linkClass } from './ui'

/** The small footer on every page, with the link to the About page (frontend-spec.md §4.8). */
export function SiteFooter() {
  return (
    <footer className="mt-10 flex justify-center border-t border-line pt-4 text-sm text-muted">
      <Link to="/about" className={`${linkClass} inline-flex min-h-11 items-center px-2 font-normal text-muted no-underline hover:underline`}>
        About PlanMyTrip
      </Link>
    </footer>
  )
}
