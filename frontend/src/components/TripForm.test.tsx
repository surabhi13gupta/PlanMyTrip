import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { addDays, format } from 'date-fns'
import { withQueryClient } from '../test/render'
import { TripForm } from './TripForm'

const iso = (daysFromToday: number) => format(addDays(new Date(), daysFromToday), 'yyyy-MM-dd')

function setup() {
  const onSubmit = vi.fn().mockResolvedValue(undefined)
  withQueryClient(<TripForm submitLabel="Plan" onSubmit={onSubmit} onCancel={() => {}} />)
  return { onSubmit, user: userEvent.setup() }
}

describe('TripForm', () => {
  it('shows fields in the mockup order: From, To, Destination, Trip type', () => {
    setup()
    const labels = [...document.querySelectorAll('label, legend')].map((el) => el.textContent?.trim())
    expect(labels.slice(0, 4)).toEqual(['From', 'To', 'Destination', 'Trip type'])
    expect(screen.getByRole('button', { name: 'Plan' })).toBeInTheDocument()
  })

  it('shows the live trip length as dates are picked', async () => {
    const { user } = setup()
    expect(screen.getByText('Up to 14 days')).toBeInTheDocument()
    await user.type(screen.getByLabelText('From'), iso(10))
    await user.type(screen.getByLabelText('To'), iso(14))
    expect(screen.getByText('5 days')).toBeInTheDocument()
  })

  it('shows every error on submit and does not submit', async () => {
    const { user, onSubmit } = setup()
    await user.click(screen.getByRole('button', { name: 'Plan' }))
    expect(await screen.findByText('Enter a valid start date.')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid end date.')).toBeInTheDocument()
    expect(screen.getByText('Enter a destination.')).toBeInTheDocument()
    expect(screen.getByText('Choose a trip type.')).toBeInTheDocument()
    expect(screen.getByLabelText('Destination')).toHaveAttribute('aria-invalid', 'true')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('rejects a 15-day trip', async () => {
    const { user, onSubmit } = setup()
    await user.type(screen.getByLabelText('From'), iso(10))
    await user.type(screen.getByLabelText('To'), iso(24))
    await user.type(screen.getByLabelText('Destination'), 'Paris, France')
    await user.click(screen.getByRole('radio', { name: 'Couple' }))
    await user.click(screen.getByRole('button', { name: 'Plan' }))
    expect(await screen.findByText('A trip can be at most 14 days long.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits valid values', async () => {
    const { user, onSubmit } = setup()
    await user.type(screen.getByLabelText('From'), iso(10))
    await user.type(screen.getByLabelText('To'), iso(14))
    await user.type(screen.getByLabelText('Destination'), '  Paris, France ')
    await user.click(screen.getByRole('radio', { name: 'Family' }))
    await user.click(screen.getByRole('button', { name: 'Plan' }))
    expect(onSubmit).toHaveBeenCalledWith(
      { startDate: iso(10), endDate: iso(14), destination: 'Paris, France', tripType: 'family' },
      expect.any(Function),
    )
  })
})
