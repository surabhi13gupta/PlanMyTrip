import { Suspense, type ReactNode } from 'react'
import { Link, Outlet, useNavigate } from 'react-router'
import { useAuth, useLogout } from '../hooks/useAuth'
import { FullPageSpinner } from './States'
import { buttonClass, cardClass } from './ui'

/** Logged-in pages: header with the app name, username and Log out (frontend-spec.md §5). */
export function AppLayout() {
  const { user } = useAuth()
  const logout = useLogout()
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface px-4 md:px-6">
        <div className="mx-auto flex min-h-15 max-w-5xl items-center justify-between gap-3">
          <Link
            to="/trips"
            className="rounded-sm text-lg font-semibold text-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            PlanMyTrip
          </Link>
          <div className="flex min-w-0 items-center gap-2 text-[0.9375rem] text-muted">
            <span className="truncate">{user?.username}</span>
            <button
              type="button"
              className={buttonClass.ghost}
              onClick={() => logout.mutate(undefined, { onSettled: () => navigate('/login') })}
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pt-8 pb-28 md:px-6 md:pb-12">
        <Suspense fallback={<FullPageSpinner />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}

/** Signup and Login: a centered card (frontend-spec.md §4.1–4.2). */
export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="grid w-full max-w-md gap-6">
        <p className="text-center text-2xl font-semibold text-primary">PlanMyTrip</p>
        <div className={`${cardClass} grid gap-5 p-6`}>
          <h1 className="text-xl font-semibold text-primary">{title}</h1>
          {children}
        </div>
      </div>
    </main>
  )
}
