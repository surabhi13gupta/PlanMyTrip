import { render, screen } from '@testing-library/react'
import { DayWeather } from './DayWeather'

// jsdom's navigator.language is en-US, so temperatures are in °F unless a test changes it.
function setLanguage(language: string) {
  Object.defineProperty(navigator, 'language', { value: language, configurable: true })
}

describe('DayWeather', () => {
  afterEach(() => setLanguage('en-US'))

  it('shows the icon, labelled high and low in °C, and rain when it is 30% or more', () => {
    setLanguage('en-GB')
    render(<DayWeather date="2026-10-20" forecast={{ date: '2026-10-20', code: 61, high: 17.6, low: 10.8, rainChance: 60 }} />)
    expect(screen.getByText('Forecast: rain, high 18°C, low 11°C, 60% chance of rain')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByText('18°C')).toBeInTheDocument()
    expect(screen.getByText('Low')).toBeInTheDocument()
    expect(screen.getByText('11°C')).toBeInTheDocument()
    expect(screen.getByText('💧 60%')).toBeInTheDocument()
  })

  it('uses °F for US English', () => {
    setLanguage('en-US')
    render(<DayWeather date="2026-10-20" forecast={{ date: '2026-10-20', code: 0, high: 75.2, low: 59, rainChance: null }} />)
    expect(screen.getByText('75°F')).toBeInTheDocument()
    expect(screen.getByText('59°F')).toBeInTheDocument()
  })

  it('leaves out a low chance of rain', () => {
    setLanguage('fr-FR')
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
