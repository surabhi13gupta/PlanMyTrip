import { Link } from 'react-router'
import { SiteBanner } from '../components/SiteBanner'
import { cardClass, linkClass } from '../components/ui'

/** Shown for unknown addresses, and for trips that don't exist or aren't the user's. */
export function NotFoundContent() {
  return (
    <div className={`${cardClass} grid justify-items-start gap-3 p-6`}>
      <h1 className="text-2xl font-semibold text-primary">Page not found</h1>
      <p className="text-muted">This page doesn't exist, or you don't have access to it.</p>
      <Link to="/trips" className={linkClass}>
        Go to My Trips
      </Link>
    </div>
  )
}

export default function NotFoundPage() {
  return (
    <div className="min-h-dvh">
      <SiteBanner />
      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <NotFoundContent />
      </main>
    </div>
  )
}
