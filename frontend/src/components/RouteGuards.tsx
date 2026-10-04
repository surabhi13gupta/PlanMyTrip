import type { ReactNode } from 'react'
import { Navigate, useLocation, useSearchParams } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { safeRedirect } from '../lib/redirect'

/** Logged-out users go to /login?redirect=<where they were going> (frontend-spec.md §3). */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirect}`} replace />
  }
  return children
}

/** Logged-in users on /login or /signup go to their redirect target, or /trips. */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [params] = useSearchParams()
  if (user) return <Navigate to={safeRedirect(params.get('redirect'))} replace />
  return children
}
