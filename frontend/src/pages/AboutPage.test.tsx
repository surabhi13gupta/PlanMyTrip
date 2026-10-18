import { screen } from '@testing-library/react'
import { renderRoutes } from '../test/render'
import type { User } from '../types'
import AboutPage from './AboutPage'

function render(user: User | null) {
  return renderRoutes([{ path: '/about', element: <AboutPage /> }], '/about', (queryClient) =>
    queryClient.setQueryData(['me'], user),
  )
}

describe('AboutPage', () => {
  it('says what the app does and invites a logged-out visitor to sign up', () => {
    render(null)
    expect(screen.getByRole('heading', { level: 1, name: 'About PlanMyTrip' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'What you can do' })).toBeInTheDocument()
    expect(screen.getByText('Your trips are private to your account.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create a free account' })).toHaveAttribute('href', '/signup')
    expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument()
  })

  it('sends a logged-in visitor to My Trips, with Log out in the banner', () => {
    render({ id: 'u1', username: 'surabhi', name: 'Surabhi Gupta', createdAt: '2026-10-04T10:00:00Z' })
    expect(screen.getByRole('link', { name: 'Go to My Trips' })).toHaveAttribute('href', '/trips')
    expect(screen.queryByRole('link', { name: 'Create a free account' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument()
  })
})
