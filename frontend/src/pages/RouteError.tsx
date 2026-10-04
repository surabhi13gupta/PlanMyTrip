import { useRouteError } from 'react-router'
import { buttonClass, cardClass } from '../components/ui'

/** Fallback for unexpected crashes on a route (frontend-spec.md §12). */
export function RouteError() {
  const error = useRouteError()
  console.error(error)
  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <div role="alert" className={`${cardClass} grid justify-items-start gap-3 p-6`}>
        <h1 className="text-2xl font-semibold text-primary">Something went wrong</h1>
        <p className="text-muted">Reloading the page usually fixes this.</p>
        <button type="button" className={buttonClass.primary} onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    </main>
  )
}
