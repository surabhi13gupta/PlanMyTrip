import { displayName, greetingName } from './greeting'

describe('greetingName (My Trips greeting)', () => {
  it('uses the first name', () => {
    expect(greetingName({ name: 'Surabhi Gupta', username: 'surabhi' })).toBe('Surabhi')
    expect(greetingName({ name: 'Surabhi', username: 'surabhi' })).toBe('Surabhi')
  })

  it('ignores extra spaces', () => {
    expect(greetingName({ name: '   Surabhi    Gupta  ', username: 'surabhi' })).toBe('Surabhi')
  })

  it('falls back to the username when there is no name', () => {
    expect(greetingName({ name: null, username: 'surabhi' })).toBe('surabhi')
    expect(greetingName({ name: '   ', username: 'surabhi' })).toBe('surabhi')
  })
})

describe('displayName (banner, next to Log out)', () => {
  it('uses the full name, or the username when there is no name', () => {
    expect(displayName({ name: ' Surabhi Gupta ', username: 'surabhi' })).toBe('Surabhi Gupta')
    expect(displayName({ name: null, username: 'surabhi' })).toBe('surabhi')
  })
})
