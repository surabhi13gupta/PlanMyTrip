import { lazy, Suspense, useEffect } from 'react'
import { createBrowserRouter, Navigate, Outlet, type RouteObject } from 'react-router'
import { AppLayout } from './components/Layouts'
import { ProtectedRoute, PublicOnlyRoute } from './components/RouteGuards'
import { FullPageSpinner } from './components/States'
import { useAuth } from './hooks/useAuth'
import { installPagehideFlush } from './lib/unsavedForms'
import { RouteError } from './pages/RouteError'
import { setSessionExpiredHandler } from './queryClient'

// Pages are loaded per route, keeping the first download small (frontend-spec.md §13).
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SignupPage = lazy(() => import('./pages/SignupPage'))
const TripsPage = lazy(() => import('./pages/TripsPage'))
const NewTripPage = lazy(() => import('./pages/NewTripPage'))
const TripPage = lazy(() => import('./pages/TripPage'))
const EditTripPage = lazy(() => import('./pages/EditTripPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

/** Waits for the startup session check, and saves open forms if the page closes. */
function AppShell() {
  const { isLoading } = useAuth()
  useEffect(() => installPagehideFlush(), [])
  if (isLoading) return <FullPageSpinner />
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Outlet />
    </Suspense>
  )
}

function RootRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? '/trips' : '/login'} replace />
}

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <RootRedirect /> },
      { path: 'login', element: <PublicOnlyRoute><LoginPage /></PublicOnlyRoute> },
      { path: 'signup', element: <PublicOnlyRoute><SignupPage /></PublicOnlyRoute> },
      {
        path: 'trips',
        element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
        errorElement: <RouteError />,
        children: [
          { index: true, element: <TripsPage /> },
          { path: 'new', element: <NewTripPage /> },
          { path: ':tripId', element: <TripPage /> },
          { path: ':tripId/edit', element: <EditTripPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export const router = createBrowserRouter(routes)

// Session-expired flow: back to login, then return to where the user was.
setSessionExpiredHandler((redirectTo) => {
  void router.navigate(`/login?redirect=${encodeURIComponent(redirectTo)}`, { replace: true })
})
