import { screen } from '@testing-library/react'
import { renderRoutes } from '../test/render'
import { API, http, HttpResponse, server } from '../test/server'
import SharedTripPage from './SharedTripPage'

// Dates in the past: no weather is fetched.
const SHARED = {
  destination: 'Paris, France',
  startDate: '2026-10-10',
  endDate: '2026-10-12',
  tripType: 'couple',
  durationDays: 3,
  activities: [
    { dayNumber: 1, title: 'Arrive', time: null, notes: null },
    { dayNumber: 2, title: 'Louvre', time: '09:00', notes: 'Denon wing' },
  ],
}

function render() {
  return renderRoutes([{ path: '/s/:shareToken', element: <SharedTripPage /> }], '/s/abc123', (queryClient) =>
    queryClient.setQueryData(['me'], null),
  )
}

describe('SharedTripPage', () => {
  it('shows the plan read-only, with Map links and a PDF download', async () => {
    server.use(http.get(`${API}/shared/abc123`, () => HttpResponse.json(SHARED)))
    render()
    expect(await screen.findByRole('heading', { level: 1, name: 'Paris, France' })).toBeInTheDocument()
    expect(screen.getByText('Shared trip · Read-only')).toBeInTheDocument()
    expect(screen.getByText('Louvre')).toBeInTheDocument()
    expect(screen.getByText('Denon wing')).toBeInTheDocument()
    expect(screen.getByText('Nothing planned')).toBeInTheDocument() // Day 3
    expect(screen.getByRole('link', { name: 'Open Louvre on Google Maps (opens in a new tab)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Add activity|Edit|Delete|Share/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create a free account' })).toHaveAttribute('href', '/signup')
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex')
  })

  it('says when the link is not active', async () => {
    server.use(
      http.get(`${API}/shared/abc123`, () =>
        HttpResponse.json({ error: { code: 'NOT_FOUND', message: 'Not found.', details: [] } }, { status: 404 }),
      ),
    )
    render()
    expect(await screen.findByRole('heading', { name: "This link isn't active" })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create a free account' })).toBeInTheDocument()
  })
})
