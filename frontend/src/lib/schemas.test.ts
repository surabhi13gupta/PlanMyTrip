import { activitySchema, loginSchema, signupSchema, toActivityInput, tripSchema } from './schemas'

function messages(result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) {
  return Object.fromEntries((result.error?.issues ?? []).map((i) => [String(i.path[0]), i.message]))
}

const TODAY = '2026-10-04'
const trip = (overrides = {}) => ({
  startDate: '2026-10-10',
  endDate: '2026-10-14',
  destination: 'Paris, France',
  tripType: 'couple',
  ...overrides,
})

describe('tripSchema', () => {
  const schema = tripSchema({ today: TODAY })

  it('accepts a valid trip and trims the destination', () => {
    const result = schema.safeParse(trip({ destination: '  Paris, France ' }))
    expect(result.success && result.data.destination).toBe('Paris, France')
  })

  it('allows exactly 14 days and rejects 15', () => {
    expect(schema.safeParse(trip({ endDate: '2026-10-23' })).success).toBe(true)
    expect(messages(schema.safeParse(trip({ endDate: '2026-10-24' })))).toEqual({
      endDate: 'A trip can be at most 14 days long.',
    })
  })

  it('rejects an end date before the start date', () => {
    expect(messages(schema.safeParse(trip({ endDate: '2026-10-09' })))).toEqual({
      endDate: "The end date can't be before the start date.",
    })
  })

  it('rejects a start date in the past, but today is fine', () => {
    expect(messages(schema.safeParse(trip({ startDate: '2026-10-03', endDate: '2026-10-05' })))).toEqual({
      startDate: "The start date can't be in the past.",
    })
    expect(schema.safeParse(trip({ startDate: TODAY, endDate: TODAY })).success).toBe(true)
  })

  it('when editing, allows a past start date only if it is unchanged', () => {
    const editing = tripSchema({ today: TODAY, originalStartDate: '2026-10-01' })
    expect(editing.safeParse(trip({ startDate: '2026-10-01', endDate: '2026-10-05' })).success).toBe(true)
    expect(messages(editing.safeParse(trip({ startDate: '2026-10-02', endDate: '2026-10-05' })))).toEqual({
      startDate: "The start date can't be in the past.",
    })
  })

  it('requires every field', () => {
    expect(messages(schema.safeParse({ startDate: '', endDate: '', destination: ' ', tripType: '' }))).toEqual({
      startDate: 'Enter a valid start date.',
      endDate: 'Enter a valid end date.',
      destination: 'Enter a destination.',
      tripType: 'Choose a trip type.',
    })
  })
})

describe('signupSchema / loginSchema', () => {
  it('enforces the username and password rules', () => {
    expect(
      messages(signupSchema.safeParse({ username: 'a b', password: 'short', confirmPassword: 'short' })),
    ).toEqual({
      username: 'Use 3–30 letters, numbers, or underscores.',
      password: 'Password must be 8–72 characters.',
    })
    expect(
      messages(signupSchema.safeParse({ username: 'Surabhi_1', password: 'correct-horse', confirmPassword: 'x' })),
    ).toEqual({ confirmPassword: "Passwords don't match." })
  })

  it('login only requires non-empty fields', () => {
    expect(messages(loginSchema.safeParse({ username: ' ', password: '' }))).toEqual({
      username: 'Enter your username.',
      password: 'Enter your password.',
    })
  })
})

describe('activitySchema', () => {
  it('validates title, time, and notes', () => {
    expect(messages(activitySchema.safeParse({ title: ' ', time: '25:00', notes: 'x'.repeat(501) }))).toEqual({
      title: 'Enter a title.',
      time: 'Use a time like 09:30.',
      notes: 'Notes can be at most 500 characters.',
    })
  })

  it('sends empty optional fields as null', () => {
    expect(toActivityInput({ title: ' Louvre ', time: '', notes: '  ' })).toEqual({
      title: 'Louvre',
      time: null,
      notes: null,
    })
  })
})
