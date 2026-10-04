import { screen } from '@testing-library/react'
import { renderRoutes } from '../test/render'
import { AppLayout, AuthLayout } from './Layouts'

const user = { id: 'u1', username: 'surabhi_travels_2026', createdAt: '2026-10-04T10:00:00Z' }

function render(path: string, loggedIn: boolean) {
  return renderRoutes(
    [
      { path: '/login', element: <AuthLayout title="Log in"><p>form</p></AuthLayout> },
      { path: '/trips', element: <AppLayout />, children: [{ index: true, element: <p>trips</p> }] },
    ],
    path,
    (queryClient) => queryClient.setQueryData(['me'], loggedIn ? user : null),
  )
}

describe('SiteBanner', () => {
  it('shows the decorative photo and the logo, linking to login when logged out', () => {
    const { container } = render('/login', false)
    const photo = container.querySelector('header img')
    expect(photo).toHaveAttribute('alt', '') // decorative: screen readers skip it
    expect(photo).toHaveAttribute('fetchpriority', 'high')
    const logo = screen.getByRole('link', { name: 'PlanMyTrip, home' })
    expect(logo).toHaveAttribute('href', '/login')
    expect(logo).toHaveTextContent('PlanMyTrip')
  })

  it('puts the login heading and form below the banner, with no card around them', () => {
    const { container } = render('/login', false)
    const heading = screen.getByRole('heading', { level: 1, name: 'Log in' })
    expect(container.querySelector('header')?.compareDocumentPosition(heading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(heading.closest('.border-line')).toBeNull()
  })

  it('logged in: logo links to My Trips; username and Log out stay on one line', () => {
    render('/trips', true)
    expect(screen.getByRole('link', { name: 'PlanMyTrip, home' })).toHaveAttribute('href', '/trips')
    const name = screen.getByText('surabhi_travels_2026')
    // Long usernames are cut short with "…" (full name in the tooltip) instead of wrapping.
    expect(name).toHaveClass('truncate')
    expect(name).toHaveAttribute('title', 'surabhi_travels_2026')
    const row = name.parentElement!
    expect(row).toHaveClass('flex-nowrap', 'whitespace-nowrap')
    expect(screen.getByRole('button', { name: 'Log out' })).toHaveClass('shrink-0', 'whitespace-nowrap')
  })
})
