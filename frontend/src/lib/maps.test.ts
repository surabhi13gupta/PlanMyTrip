import { mapsSearchUrl } from './maps'

describe('mapsSearchUrl', () => {
  it('builds a Google Maps search link', () => {
    expect(mapsSearchUrl('museums in Paris, France')).toBe(
      'https://www.google.com/maps/search/?api=1&query=museums%20in%20Paris%2C%20France',
    )
  })

  it('encodes characters that would break the link, and trims spaces', () => {
    const url = mapsSearchUrl("  Musée d'Orsay & café #1, Paris  ")
    expect(url).toBe(
      'https://www.google.com/maps/search/?api=1&query=Mus%C3%A9e%20d\'Orsay%20%26%20caf%C3%A9%20%231%2C%20Paris',
    )
    expect(new URL(url).searchParams.get('query')).toBe("Musée d'Orsay & café #1, Paris")
  })
})
