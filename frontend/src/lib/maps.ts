// Google Maps search links (frontend-spec.md §4.5.1–4.5.2). These are Google's public Maps URLs:
// no API key, no account, no cost, and nothing is sent to Google until the traveler clicks.

const MAPS_SEARCH = 'https://www.google.com/maps/search/?api=1&query='

/** A link that opens Google Maps (the app on phones) searching for `query`. */
export function mapsSearchUrl(query: string): string {
  return MAPS_SEARCH + encodeURIComponent(query.trim())
}
