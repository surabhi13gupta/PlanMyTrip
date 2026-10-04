import { useEffect, useState } from 'react'

type ApiState =
  | { kind: 'checking' }
  | { kind: 'ok' }
  | { kind: 'error'; message: string }

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

// Setup check page: proves the frontend, the API, and the database are wired together.
// Replaced by the real app in Step 3.
export default function App() {
  const [api, setApi] = useState<ApiState>({ kind: 'checking' })

  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then(async (response) => {
        if (response.ok) {
          setApi({ kind: 'ok' })
          return
        }
        const body = await response.json().catch(() => null)
        setApi({ kind: 'error', message: body?.error?.message ?? `HTTP ${response.status}` })
      })
      .catch(() => setApi({ kind: 'error', message: "Can't reach the API." }))
  }, [])

  return (
    <main className="mx-auto grid max-w-xl gap-6 px-4 py-16 md:px-6">
      <h1 className="text-2xl font-semibold text-balance text-primary">Welcome to PlanMyTrip</h1>
      <section className="grid gap-3 rounded-[10px] border border-line bg-surface p-5">
        <h2 className="text-xl font-semibold text-primary">Setup check</h2>
        <p className="text-muted">Frontend, API, and database connection</p>
        <p aria-live="polite" className="flex items-center gap-2 font-medium">
          <span
            aria-hidden="true"
            className={
              'inline-block size-3 rounded-full ' +
              (api.kind === 'ok' ? 'bg-primary' : api.kind === 'error' ? 'bg-danger' : 'bg-line')
            }
          />
          {api.kind === 'checking' && 'API: checking…'}
          {api.kind === 'ok' && 'API: ok'}
          {api.kind === 'error' && <span className="text-danger">API: {api.message}</span>}
        </p>
      </section>
    </main>
  )
}
