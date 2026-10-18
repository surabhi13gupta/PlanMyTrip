import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { getTripDays } from '../lib/dates'
import { withQueryClient } from '../test/render'
import { API, http, HttpResponse, makeTrip, server } from '../test/server'
import type { IdeaPlace, TripDetail } from '../types'
import { IdeasPanel } from './IdeasPanel'

const ORSAY: IdeaPlace = {
  id: 'orsay',
  name: "Musée d'Orsay",
  rating: 4.8,
  reviews: 98214,
  priceLevel: null,
  type: 'Art museum',
  address: "1 Rue de la Légion d'Honneur, 75007 Paris, France",
  thumbnailUrl: null,
}

function ideasHandler(onRequest?: (category: string) => void, ideas: IdeaPlace[] = [ORSAY]) {
  return http.get(`${API}/trips/:tripId/ideas`, ({ request }) => {
    const category = new URL(request.url).searchParams.get('category') ?? ''
    onRequest?.(category)
    return HttpResponse.json({ category, query: `${category} in Paris, France`, fetchedAt: '2026-10-18T09:12:00Z', ideas })
  })
}

function Harness({ trip, initialDay = 1 }: { trip: TripDetail; initialDay?: number }) {
  const [day, setDay] = useState(initialDay)
  return (
    <IdeasPanel
      trip={trip}
      days={getTripDays(trip.startDate, trip.endDate)}
      open
      dayNumber={day}
      onDayChange={setDay}
      onClose={() => {}}
    />
  )
}

describe('IdeasPanel', () => {
  it('shows five common tabs plus three for the Trip Type, and fetches Top sights first', async () => {
    const requested: string[] = []
    server.use(ideasHandler((c) => requested.push(c)))
    withQueryClient(<Harness trip={makeTrip({ tripType: 'family' })} />)

    const tabs = within(screen.getByRole('tablist')).getAllByRole('tab')
    expect(tabs.map((t) => t.textContent)).toEqual([
      'Top sights', 'Museums', 'Parks', 'Restaurants', 'Cafés',
      'Kid-friendly', 'Zoos & aquariums', 'Playgrounds',
    ])
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(await screen.findByText("Musée d'Orsay")).toBeInTheDocument()
    expect(screen.getByText('4.8')).toBeInTheDocument()
    expect(screen.getByText(/98k/)).toBeInTheDocument()
    expect(requested).toEqual(['top-sights'])
  })

  it('fetches a category only when its tab is opened, and only once', async () => {
    const requested: string[] = []
    server.use(ideasHandler((c) => requested.push(c)))
    withQueryClient(<Harness trip={makeTrip()} />)
    await screen.findByText("Musée d'Orsay")

    await userEvent.click(screen.getByRole('tab', { name: 'Museums' }))
    await screen.findByText("Musée d'Orsay")
    await userEvent.click(screen.getByRole('tab', { name: 'Top sights' }))
    expect(requested).toEqual(['top-sights', 'museums'])
  })

  it('adds an idea to the picked day as an activity, then shows it as added', async () => {
    let body: unknown
    server.use(
      ideasHandler(),
      http.post(`${API}/trips/:tripId/activities`, async ({ request }) => {
        body = await request.json()
        return HttpResponse.json({ id: 'a1', ...(body as object) }, { status: 201 })
      }),
      http.get(`${API}/trips/:tripId`, () => HttpResponse.json(makeTrip())),
    )
    withQueryClient(<Harness trip={makeTrip()} />)
    await screen.findByText("Musée d'Orsay")

    await userEvent.selectOptions(screen.getByLabelText('Add to'), '3')
    await userEvent.click(screen.getByRole('button', { name: "Add Musée d'Orsay to Day 3" }))

    expect(await screen.findByRole('button', { name: '✓ Added to Day 3' })).toBeDisabled()
    expect(body).toEqual({
      dayNumber: 3,
      title: "Musée d'Orsay",
      time: null,
      notes: "1 Rue de la Légion d'Honneur, 75007 Paris, France",
    })

    // Another day can still get the same idea.
    await userEvent.selectOptions(screen.getByLabelText('Add to'), '4')
    expect(screen.getByRole('button', { name: "Add Musée d'Orsay to Day 4" })).toBeEnabled()
  })

  it('says when nothing was found, with a Google Maps link', async () => {
    server.use(ideasHandler(undefined, []))
    withQueryClient(<Harness trip={makeTrip()} />)
    expect(await screen.findByText('No top sights found for Paris, France.')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'Search Google Maps instead' })
    expect(new URL(link.getAttribute('href')!).searchParams.get('query')).toBe('top attractions in Paris, France')
  })

  it.each([
    ['IDEAS_UNAVAILABLE', 503, /this month's free searches are used up/],
    ['IDEAS_DAILY_LIMIT', 429, /20 new idea lists today/],
  ])('explains %s and offers Retry and Google Maps', async (code, status, text) => {
    let calls = 0
    server.use(
      http.get(`${API}/trips/:tripId/ideas`, () => {
        calls += 1
        return HttpResponse.json({ error: { code, message: 'x', details: [] } }, { status })
      }),
    )
    withQueryClient(<Harness trip={makeTrip()} />)
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(text)
    expect(within(alert).getByRole('link', { name: 'Search Google Maps instead' })).toBeInTheDocument()
    expect(calls).toBe(1) // no automatic retry: each retry could spend a free search

    await userEvent.click(within(alert).getByRole('button', { name: 'Retry' }))
    await waitFor(() => expect(calls).toBe(2))
  })
})
