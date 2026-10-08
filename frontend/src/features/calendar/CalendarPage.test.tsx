import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { holidayCalendar2027, season, seasonCalendar } from '@/mocks/data'
import { SeasonCalendar } from './CalendarPage'

// The months on the page (docs/specs/season-calendar.md, rule 4a). The season runs from January to April of 2027.

function calendar(today: string, showAll = false, entries = seasonCalendar) {
  render(
    <MemoryRouter>
      <SeasonCalendar season={{ ...season, starts_on: '2027-01-01' }} entries={entries} holidays={holidayCalendar2027} today={today} showAll={showAll} />
    </MemoryRouter>,
  )
  return screen.getAllByRole('region').map((month) => month.getAttribute('aria-labelledby'))
}

afterEach(cleanup)

describe('SeasonCalendar', () => {
  it('shows the months from this one to the last, with a link to the complete calendar', () => {
    expect(calendar('2027-02-20')).toEqual(['month-2027-02', 'month-2027-03', 'month-2027-04'])
    expect(screen.getByRole('link', { name: 'Ver o calendário completo' })).toHaveAttribute('href', '/calendar?view=all')
    // The next night, 12/03, is in the second month on the page.
    expect(screen.getByRole('button', { name: 'Ver no calendário' })).toBeInTheDocument()
  })

  it('shows every month on the complete calendar, with a link back', () => {
    expect(calendar('2027-02-20', true)).toEqual(['month-2027-01', 'month-2027-02', 'month-2027-03', 'month-2027-04'])
    expect(screen.getByRole('link', { name: 'Ver a partir deste mês' })).toHaveAttribute('href', '/calendar')
  })

  it('shows only the last month when today is in it', () => {
    expect(calendar('2027-04-01')).toEqual(['month-2027-04'])
    expect(screen.getByRole('link', { name: 'Ver o calendário completo' })).toBeInTheDocument()
  })

  it('shows every month of a season that does not include today, with no link', () => {
    expect(calendar('2026-10-08')).toEqual(['month-2027-01', 'month-2027-02', 'month-2027-03', 'month-2027-04'])
    expect(screen.queryByRole('link', { name: 'Ver o calendário completo' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Ver a partir deste mês' })).not.toBeInTheDocument()
  })

  it('shows no link in the first month, where the page is already the whole season', () => {
    expect(calendar('2027-01-10')).toEqual(['month-2027-01', 'month-2027-02', 'month-2027-03', 'month-2027-04'])
    expect(screen.queryByRole('link', { name: 'Ver o calendário completo' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Ver a partir deste mês' })).not.toBeInTheDocument()
  })

  it('has no "Ir para hoje" on the page from this month on, where today is at the top', () => {
    const finished = seasonCalendar.filter((e) => !e.night || e.night.status === 'finished')
    calendar('2027-02-20', false, finished)
    expect(screen.queryByRole('button', { name: 'Ir para hoje' })).not.toBeInTheDocument()
  })
})
