import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { withQueryClient } from '../test/render'
import { API, http, HttpResponse, makeTrip, server } from '../test/server'
import type { TripDetail } from '../types'
import { ShareDialog } from './ShareDialog'

// The dialog shows whatever trip it's given; the test swaps it in when the API changes it.
function Harness({ initial }: { initial: TripDetail }) {
  const [trip, setTrip] = useState(initial)
  server.use(
    http.post(`${API}/trips/:tripId/share`, () => {
      setTrip((t) => ({ ...t, shareToken: 'abc123' }))
      return HttpResponse.json({ shareToken: 'abc123', sharedAt: '2026-10-18T10:00:00Z' })
    }),
    http.delete(`${API}/trips/:tripId/share`, () => {
      setTrip((t) => ({ ...t, shareToken: null }))
      return new HttpResponse(null, { status: 204 })
    }),
    http.get(`${API}/trips/:tripId`, () => HttpResponse.json(trip)),
  )
  return <ShareDialog trip={trip} open onClose={() => {}} />
}

describe('ShareDialog', () => {
  it('creates a link, copies it, and turns it off after asking', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    withQueryClient(<Harness initial={makeTrip()} />)

    expect(screen.getByText(/won't see your name/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Create link' }))

    const input = await screen.findByLabelText('Share link')
    expect(input).toHaveValue(`${window.location.origin}/s/abc123`)
    await userEvent.click(screen.getByRole('button', { name: 'Copy' }))
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/s/abc123`)
    expect(await screen.findByRole('button', { name: '✓ Copied' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Turn off link' }))
    expect(screen.getByText(/won't be able to open the trip/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Turn off' }))
    expect(await screen.findByRole('button', { name: 'Create link' })).toBeInTheDocument()
  })

  it('keeps the link when the owner changes their mind', async () => {
    withQueryClient(<Harness initial={makeTrip({ shareToken: 'abc123' })} />)
    await userEvent.click(screen.getByRole('button', { name: 'Turn off link' }))
    await userEvent.click(screen.getByRole('button', { name: 'Keep' }))
    expect(screen.getByLabelText('Share link')).toHaveValue(`${window.location.origin}/s/abc123`)
  })
})
