import {
  formatDateRange,
  formatDayLabel,
  formatFromTo,
  getTripDays,
  getTripDuration,
  isValidISODate,
  todayISO,
} from './dates'

describe('getTripDuration', () => {
  it('counts both the start and end dates', () => {
    expect(getTripDuration('2026-10-10', '2026-10-12')).toBe(3)
    expect(getTripDuration('2026-10-10', '2026-10-10')).toBe(1)
    expect(getTripDuration('2026-10-10', '2026-10-23')).toBe(14)
  })

  it('crosses month, year, and daylight-saving boundaries correctly', () => {
    expect(getTripDuration('2026-12-28', '2027-01-06')).toBe(10)
    expect(getTripDuration('2026-03-27', '2026-03-31')).toBe(5) // DST change in Europe
    expect(getTripDuration('2026-10-30', '2026-11-02')).toBe(4) // DST change in the US
  })
})

describe('getTripDays', () => {
  it('lists Day 1 … Day N with calendar dates', () => {
    expect(getTripDays('2026-10-30', '2026-11-01')).toEqual([
      { dayNumber: 1, date: '2026-10-30' },
      { dayNumber: 2, date: '2026-10-31' },
      { dayNumber: 3, date: '2026-11-01' },
    ])
  })

  it('returns no days when the end is before the start', () => {
    expect(getTripDays('2026-10-12', '2026-10-10')).toEqual([])
  })
})

describe('formatting', () => {
  it('formats labels the way the spec shows them', () => {
    expect(formatDayLabel('2026-10-11')).toBe('Sun, Oct 11')
    expect(formatDateRange('2026-10-10', '2026-10-14')).toBe('Oct 10 – Oct 14, 2026')
    expect(formatDateRange('2026-12-28', '2027-01-06')).toBe('Dec 28, 2026 – Jan 6, 2027')
    expect(formatFromTo('2026-10-10', '2026-10-14')).toBe('From Oct 10 → To Oct 14, 2026')
  })
})

describe('isValidISODate / todayISO', () => {
  it('accepts only real YYYY-MM-DD dates', () => {
    expect(isValidISODate('2026-10-10')).toBe(true)
    expect(isValidISODate('2026-02-30')).toBe(false)
    expect(isValidISODate('10/10/2026')).toBe(false)
    expect(isValidISODate('')).toBe(false)
  })

  it("uses the user's local date", () => {
    expect(todayISO(new Date(2026, 9, 4, 23, 30))).toBe('2026-10-04')
  })
})
