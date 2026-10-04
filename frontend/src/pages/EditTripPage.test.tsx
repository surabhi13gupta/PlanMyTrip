import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { addDays, format } from 'date-fns'
import { renderRoutes } from '../test/render'
import { API, http, HttpResponse, makeActivity, makeTrip, server } from '../test/server'
import EditTripPage from './EditTripPage'

const iso = (n: number) => format(addDays(new Date(), n), 'yyyy-MM-dd')

const trip = makeTrip({
  startDate: iso(10),
  endDate: iso(14), // 5 days
  activities: [
    makeActivity({ dayNumber: 2, title: 'Louvre' }),
    makeActivity({ dayNumber: 4, title: 'Versailles' }),
    makeActivity({ dayNumber: 5, title: 'Shopping' }),
    makeActivity({ dayNumber: 5, title: 'Dinner' }),
  ],
})

function setup() {
  const patches: unknown[] = []
  server.use(
    http.get(`${API}/trips/trip-1`, () => HttpResponse.json(trip)),
    http.patch(`${API}/trips/trip-1`, async ({ request }) => {
      patches.push(await request.json())
      return HttpResponse.json({ ...trip, endDate: iso(12), durationDays: 3 })
    }),
    http.get(`${API}/trips`, () => HttpResponse.json({ trips: [] })),
  )
  const utils = renderRoutes(
    [
      { path: '/trips/:tripId/edit', element: <EditTripPage /> },
      { path: '/trips/:tripId', element: <p>Trip page</p> },
    ],
    '/trips/trip-1/edit',
  )
  return { ...utils, patches, user: userEvent.setup() }
}

async function shortenTo3Days(user: ReturnType<typeof userEvent.setup>) {
  const to = await screen.findByLabelText('To')
  await user.clear(to)
  await user.type(to, iso(12))
  await user.click(screen.getByRole('button', { name: 'Save' }))
}

describe('Edit Trip shortening warning', () => {
  it('warns with the number of activities that will be deleted, and Cancel changes nothing', async () => {
    const { user, patches } = setup()
    await shortenTo3Days(user)
    expect(
      await screen.findByText('Your new dates remove days that have 3 activities. They will be deleted.'),
    ).toBeInTheDocument()
    // A real browser makes the page behind an open modal inert; jsdom doesn't, so look in the dialog.
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancel' }))
    expect(patches).toEqual([])
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('confirming sends confirmDeleteActivities and returns to the trip', async () => {
    const { user, patches } = setup()
    await shortenTo3Days(user)
    await user.click(await screen.findByRole('button', { name: 'Delete and save' }))
    expect(await screen.findByText('Trip page')).toBeInTheDocument()
    expect(patches).toEqual([
      {
        startDate: iso(10),
        endDate: iso(12),
        destination: 'Paris, France',
        tripType: 'couple',
        confirmDeleteActivities: true,
      },
    ])
  })

  it('moving dates without shortening saves without a warning', async () => {
    const { user, patches } = setup()
    const from = await screen.findByLabelText('From')
    await user.clear(from)
    await user.type(from, iso(11))
    const to = screen.getByLabelText('To')
    await user.clear(to)
    await user.type(to, iso(15))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Trip page')).toBeInTheDocument()
    expect(patches).toHaveLength(1)
    expect(screen.queryByText(/will be deleted/)).not.toBeInTheDocument()
  })
})
