import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiError } from './api/client'
import { clearTabLogin } from './lib/tabSession'

export const queryKeys = {
  me: ['me'] as const,
  trips: ['trips'] as const,
  trip: (tripId: string) => ['trip', tripId] as const,
}

/** Set by the router module: where to send the user when their session has ended. */
let onSessionExpired: (redirectTo: string) => void = (redirectTo) => {
  window.location.assign(`/login?redirect=${encodeURIComponent(redirectTo)}`)
}
export function setSessionExpiredHandler(handler: (redirectTo: string) => void): void {
  onSessionExpired = handler
}

let expiring = false

/** Session-expired flow (frontend-spec.md §7, flow 6): any 401 UNAUTHORIZED outside startup. */
function handleUnauthorized(error: unknown, isMeQuery: boolean): void {
  if (!(error instanceof ApiError) || error.status !== 401 || error.code !== 'UNAUTHORIZED') return
  if (isMeQuery || expiring) return
  expiring = true
  const redirectTo = window.location.pathname + window.location.search
  clearTabLogin()
  queryClient.clear()
  queryClient.setQueryData(queryKeys.me, null)
  toast('Please log in again.')
  onSessionExpired(redirectTo)
  setTimeout(() => {
    expiring = false
  }, 0)
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => handleUnauthorized(error, query.queryKey[0] === 'me'),
  }),
  mutationCache: new MutationCache({
    onError: (error) => handleUnauthorized(error, false),
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Don't retry "not logged in" / "not found" / validation answers; retry flaky network once.
      retry: (count, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) && count < 1,
    },
  },
})
