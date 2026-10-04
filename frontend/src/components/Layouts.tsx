import { Suspense, type ReactNode } from 'react'
import { Outlet, useNavigate } from 'react-router'
import { useAuth, useLogout } from '../hooks/useAuth'
import { SiteBanner } from './SiteBanner'
import { FullPageSpinner } from './States'

/** Logged-in pages: the banner with username and Log out, then the page (frontend-spec.md §5). */
export function AppLayout() {
  const { user } = useAuth()
  const logout = useLogout()
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh">
      <SiteBanner>
        <div className="flex min-w-0 flex-nowrap items-center gap-1 text-[0.9375rem] whitespace-nowrap text-white">
          <span className="min-w-0 max-w-[8rem] truncate sm:max-w-[16rem]" title={user?.username}>
            {user?.username}
          </span>
          <button
            type="button"
            className={
              'min-h-11 shrink-0 rounded-lg px-2.5 font-medium whitespace-nowrap text-white transition-colors ' +
              'hover:bg-white/15 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-white'
            }
            onClick={() => logout.mutate(undefined, { onSettled: () => navigate('/login') })}
          >
            Log out
          </button>
        </div>
      </SiteBanner>
      <main className="mx-auto max-w-5xl px-4 pt-8 pb-28 md:px-6 md:pb-12">
        <Suspense fallback={<FullPageSpinner />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}

/** Signup and Login: the banner, then the heading and form directly on the page, no card (§4.1–4.2). */
export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <SiteBanner />
      <main className="mx-auto grid w-full max-w-md gap-5 px-4 pt-8 pb-12">
        <h1 className="text-2xl font-semibold text-primary">{title}</h1>
        {children}
      </main>
    </div>
  )
}
