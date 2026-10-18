import { render, screen } from '@testing-library/react'
import { DayWeather } from './DayWeather'

describe('DayWeather', () => {
  it('shows the icon, labelled high and low, and rain when it is 30% or more', () => {
    render(<DayWeather date="2026-10-20" forecast={{ date: '2026-10-20', code: 61, high: 17.6, low: 10.8, rainChance: 60 }} />)
    expect(screen.getByText('Forecast: rain, high 18°C, low 11°C, 60% chance of rain')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByText('18°C')).toBeInTheDocument()
    expect(screen.getByText('Low')).toBeInTheDocument()
    expect(screen.getByText('11°C')).toBeInTheDocument()
    expect(screen.getByText('💧 60%')).toBeInTheDocument()
  })

  it('uses °C even for US English browsers', () => {
    Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
    render(<DayWeather date="2026-10-20" forecast={{ date: '2026-10-20', code: 0, high: 24.2, low: 15, rainChance: null }} />)
    expect(screen.getByText('24°C')).toBeInTheDocument()
    expect(screen.queryByText(/°F/)).not.toBeInTheDocument()
  })

  it('leaves out a low chance of rain', () => {
    render(<DayWeather date="2026-10-20" forecast={{ date: '2026-10-20', code: 0, high: 24, low: 15, rainChance: 10 }} />)
    expect(screen.getByText('Forecast: clear, high 24°C, low 15°C')).toBeInTheDocument()
    expect(screen.queryByText(/💧/)).not.toBeInTheDocument()
  })

  it('says the forecast comes later for days far ahead, and nothing for past days', () => {
    const { rerender } = render(<DayWeather date="2099-01-01" />)
    expect(screen.getByText('Forecast closer to the date')).toBeInTheDocument()
    rerender(<DayWeather date="2000-01-01" />)
    expect(screen.queryByText('Forecast closer to the date')).not.toBeInTheDocument()
  })
})
