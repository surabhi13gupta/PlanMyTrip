import { screen } from '@testing-library/react'
import { renderRoutes } from '../test/render'
import { API, http, HttpResponse, server } from '../test/server'
import type { User } from '../types'
import TripsPage from './TripsPage'

function render(user: User) {
  server.use(http.get(`${API}/trips`, () => HttpResponse.json({ trips: [] })))
  return renderRoutes([{ path: '/trips', element: <TripsPage /> }], '/trips', (queryClient) =>
    queryClient.setQueryData(['me'], user),
  )
}

const base = { id: 'u1', createdAt: '2026-10-04T10:00:00Z' }

describe('My Trips greeting', () => {
  it('greets by first name, with PlanMyTrip drawn like the logo', () => {
    render({ ...base, username: 'surabhi', name: 'Surabhi Gupta' })
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Surabhi, welcome to PlanMyTrip')
    // The handwritten "My" comes from the logo's Wordmark.
    expect(screen.getByText('My')).toHaveClass('font-script')
  })

  it('greets by username when the user gave no name', () => {
    render({ ...base, username: 'surabhi', name: null })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('surabhi, welcome to PlanMyTrip')
  })
})
