import { render, screen, within } from '@testing-library/react'
import { TripIdeas } from './TripIdeas'

describe('TripIdeas', () => {
  it('shows the five common chips plus three for the Trip Type, linking to Google Maps', () => {
    render(<TripIdeas destination="Paris, France" tripType="family" />)
    expect(screen.getByRole('heading', { level: 2, name: 'Ideas for Paris, France' })).toBeInTheDocument()

    const links = within(screen.getByRole('list')).getAllByRole('link')
    expect(links.map((a) => a.textContent)).toEqual([
      'Top sights', 'Museums', 'Parks', 'Restaurants', 'Cafés',
      'Kid-friendly', 'Zoos & aquariums', 'Playgrounds',
    ])

    const museums = screen.getByRole('link', { name: 'Museums in Paris, France, on Google Maps (opens in a new tab)' })
    const url = new URL(museums.getAttribute('href')!)
    expect(url.origin + url.pathname).toBe('https://www.google.com/maps/search/')
    expect(url.searchParams.get('api')).toBe('1')
    expect(url.searchParams.get('query')).toBe('museums in Paris, France')
    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    }
  })

  it('changes the last three chips with the Trip Type', () => {
    const { rerender } = render(<TripIdeas destination="Goa" tripType="friends" />)
    expect(screen.getByRole('link', { name: /^Nightlife in Goa/ })).toBeInTheDocument()
    rerender(<TripIdeas destination="Goa" tripType="couple" />)
    expect(screen.queryByRole('link', { name: /^Nightlife/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^Romantic dinner in Goa/ })).toBeInTheDocument()
  })
})
