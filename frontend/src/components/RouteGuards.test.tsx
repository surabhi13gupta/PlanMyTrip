import { screen } from '@testing-library/react'
import { markTabLoggedIn } from '../lib/tabSession'
import { renderRoutes } from '../test/render'
import { API, http, HttpResponse, server } from '../test/server'
import { ProtectedRoute, PublicOnlyRoute } from './RouteGuards'

const routes = [
  { path: '/login', element: <PublicOnlyRoute><p>Login page</p></PublicOnlyRoute> },
  { path: '/trips', element: <ProtectedRoute><p>My trips</p></ProtectedRoute> },
  { path: '/trips/:id', element: <ProtectedRoute><p>Trip page</p></ProtectedRoute> },
]

const user = { id: 'u1', username: 'surabhi', createdAt: '2026-10-04T10:00:00Z' }

/** The startup session check has already finished, as AppShell guarantees before routes render. */
async function render(path: string, loggedIn: boolean) {
  return renderRoutes(routes, path, (queryClient) =>
    queryClient.setQueryData(['me'], loggedIn ? user : null),
  )
}

describe('route guards', () => {
  it('sends a logged-out user to login, remembering where they were going', async () => {
    const { router } = await render('/trips/abc', false)
    expect(await screen.findByText('Login page')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toBe('?redirect=%2Ftrips%2Fabc')
  })

  it('lets a logged-in user through', async () => {
    await render('/trips', true)
    expect(await screen.findByText('My trips')).toBeInTheDocument()
  })

  it('sends a logged-in user away from login, to the redirect target', async () => {
    const { router } = await render('/login?redirect=%2Ftrips%2Fabc', true)
    expect(await screen.findByText('Trip page')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/trips/abc')
  })

  it('ignores redirects to other sites', async () => {
    const { router } = await render('/login?redirect=%2F%2Fevil.example', true)
    expect(await screen.findByText('My trips')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/trips')
  })
})

describe('startup session check', () => {
  it('without the tab marker (page was closed), logs out and does not ask who is logged in', async () => {
    const calls: string[] = []
    server.use(
      http.post(`${API}/auth/logout`, () => {
        calls.push('logout')
        return new HttpResponse(null, { status: 204 })
      }),
      http.get(`${API}/auth/me`, () => {
        calls.push('me')
        return HttpResponse.json({ user })
      }),
    )
    const { loadSession } = await import('../hooks/useAuth')
    expect(await loadSession()).toBeNull()
    expect(calls).toEqual(['logout'])
  })

  it('with the tab marker (a refresh), keeps the user logged in', async () => {
    server.use(http.get(`${API}/auth/me`, () => HttpResponse.json({ user })))
    markTabLoggedIn()
    const { loadSession } = await import('../hooks/useAuth')
    expect(await loadSession()).toEqual(user)
  })

  it('with the tab marker but an ended session, clears the marker', async () => {
    server.use(
      http.get(`${API}/auth/me`, () =>
        HttpResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Please log in.', details: [] } }, { status: 401 }),
      ),
    )
    markTabLoggedIn()
    const { loadSession } = await import('../hooks/useAuth')
    expect(await loadSession()).toBeNull()
    expect(sessionStorage.getItem('pmt-tab-logged-in')).toBeNull()
  })
})
