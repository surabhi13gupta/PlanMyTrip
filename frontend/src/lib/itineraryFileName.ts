/** "Paris, France" + "2026-10-10" → "Paris-France-2026-10-10-itinerary.pdf" (frontend-spec.md §7). */
export function itineraryFileName(destination: string, startDate: string): string {
  const slug = destination
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // drop accents: "Montréal" → "Montreal"
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug || 'trip'}-${startDate}-itinerary.pdf`
}
