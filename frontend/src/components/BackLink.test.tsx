import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderRoutes } from '../test/render'
import { BackLink } from './BackLink'

const routes = [
  { path: '/', element: <p>Start page</p> },
  { path: '/trips', element: <p>My Trips page</p> },
  { path: '/trips/1', element: <BackLink to="/trips">My Trips</BackLink> },
  { path: '/about', element: <BackLink>Back</BackLink> },
]

describe('BackLink', () => {
  it('links to a fixed page when given one', async () => {
    renderRoutes(routes, '/trips/1')
    const link = screen.getByRole('link', { name: 'My Trips' })
    expect(link).toHaveAttribute('href', '/trips')
    await userEvent.click(link)
    expect(screen.getByText('My Trips page')).toBeInTheDocument()
  })

  it('goes back in history when there is a page behind it', async () => {
    const { router } = renderRoutes(routes, '/trips')
    await router.navigate('/about')
    await userEvent.click(await screen.findByRole('button', { name: 'Back' }))
    expect(await screen.findByText('My Trips page')).toBeInTheDocument()
  })

  it('goes to the start page when the page was opened directly', async () => {
    renderRoutes(routes, '/about')
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(await screen.findByText('Start page')).toBeInTheDocument()
  })
})
