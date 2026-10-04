import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { collectPendingSaves } from '../lib/unsavedForms'
import { withQueryClient } from '../test/render'
import { API, http, HttpResponse, makeActivity, server } from '../test/server'
import { DayCard } from './DayCard'

const day = { dayNumber: 2, date: '2026-10-11' }

describe('DayCard', () => {
  it('shows the day heading and date, and the empty state', () => {
    withQueryClient(<DayCard tripId="trip-1" day={day} activities={[]} />)
    expect(screen.getByRole('heading', { level: 2, name: 'Day 2' })).toBeInTheDocument()
    expect(screen.getByText('Sun, Oct 11')).toBeInTheDocument()
    expect(screen.getByText('No activities planned')).toBeInTheDocument()
  })

  it("lists only this day's activities, timed first, then untimed in order added", () => {
    const activities = [
      makeActivity({ dayNumber: 2, title: 'Walk along the Seine', createdAt: '2026-10-04T10:00:00Z' }),
      makeActivity({ dayNumber: 2, title: 'Dinner', time: '19:30', createdAt: '2026-10-04T10:01:00Z' }),
      makeActivity({ dayNumber: 1, title: 'Arrive' }),
      makeActivity({ dayNumber: 2, title: 'Louvre', time: '09:00', notes: 'Denon wing' }),
    ]
    withQueryClient(<DayCard tripId="trip-1" day={day} activities={activities} />)
    const items = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(items.map((li) => li.textContent)).toEqual([
      expect.stringContaining('Louvre'),
      expect.stringContaining('Dinner'),
      expect.stringContaining('Walk along the Seine'),
    ])
    expect(screen.getByRole('button', { name: 'Edit Louvre' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete Louvre' })).toBeInTheDocument()
  })

  it('adds an activity to this day', async () => {
    let posted: unknown
    server.use(
      http.post(`${API}/trips/trip-1/activities`, async ({ request }) => {
        posted = await request.json()
        return HttpResponse.json(makeActivity({ dayNumber: 2, title: 'Louvre' }), { status: 201 })
      }),
      http.get(`${API}/trips/trip-1`, () => HttpResponse.json({})),
    )
    const user = userEvent.setup()
    withQueryClient(<DayCard tripId="trip-1" day={day} activities={[]} />)
    await user.click(screen.getByRole('button', { name: '+ Add activity' }))
    await user.type(screen.getByLabelText('Title'), 'Louvre')
    await user.type(screen.getByLabelText('Time (optional)'), '09:00')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await vi.waitFor(() => expect(posted).toEqual({ dayNumber: 2, title: 'Louvre', time: '09:00', notes: null }))
  })

  it('registers a valid unsaved form so it is saved if the page closes', async () => {
    const user = userEvent.setup()
    withQueryClient(<DayCard tripId="trip-1" day={day} activities={[]} />)
    await user.click(screen.getByRole('button', { name: '+ Add activity' }))
    expect(collectPendingSaves()).toEqual([]) // nothing typed yet
    await user.type(screen.getByLabelText('Title'), 'Dinner cruise')
    expect(collectPendingSaves()).toEqual([
      {
        method: 'POST',
        path: '/trips/trip-1/activities',
        body: { dayNumber: 2, title: 'Dinner cruise', time: null, notes: null },
      },
    ])
    await user.keyboard('{Escape}') // cancel: the form closes and is no longer pending
    expect(collectPendingSaves()).toEqual([])
  })
})
