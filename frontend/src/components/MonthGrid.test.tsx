import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { type GridDay, MonthGrid } from './MonthGrid'

// Today and its month on the grid (docs/specs/season-calendar.md, rule 5a).

const days: Record<string, GridDay> = {
  '2027-03-12': { tone: 'night', label: 'Já agendado', href: '/nights/2' },
  '2027-03-19': { tone: 'candidate', label: 'Evento habitual', onToggle: () => {} },
}

function grid(today: string) {
  const { container } = render(
    <MemoryRouter>
      <MonthGrid month="2027-03" days={days} today={today} isDisabled={(d) => d < '2027-03-03'} />
    </MemoryRouter>,
  )
  return container.querySelectorAll('[aria-current="date"]')
}

afterEach(cleanup)

describe('MonthGrid', () => {
  it('marks today on a plain day', () => {
    const marked = grid('2027-03-10')
    expect(marked).toHaveLength(1)
    expect(marked[0]).toHaveTextContent('Quarta-feira, 10/03/2027 (hoje)')
  })

  it('marks today on a night, after the night\'s own label', () => {
    expect(grid('2027-03-12')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Sexta-feira, 12/03/2027: Já agendado (hoje)' })).toBeInTheDocument()
  })

  it('marks today on a day that can be ticked', () => {
    expect(grid('2027-03-19')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Sexta-feira, 19/03/2027: Evento habitual (hoje)' })).toBeInTheDocument()
  })

  it('marks today on a day outside the range', () => {
    const marked = grid('2027-03-01')
    expect(marked).toHaveLength(1)
    expect(marked[0]).toHaveTextContent('Segunda-feira, 01/03/2027 (hoje)')
  })

  it('marks no day when today is in another month', () => {
    expect(grid('2027-04-10')).toHaveLength(0)
    expect(screen.queryByText(/\(hoje\)/)).not.toBeInTheDocument()
  })

  it('tints the month of today', () => {
    grid('2027-03-10')
    expect(screen.getByRole('region', { name: 'Março de 2027' })).toHaveAttribute('data-current-month')
  })

  it('tints the month of today when today is outside the range', () => {
    grid('2027-03-01')
    expect(screen.getByRole('region', { name: 'Março de 2027' })).toHaveAttribute('data-current-month')
  })

  it('does not tint a month when today is in another month', () => {
    grid('2027-04-10')
    expect(screen.getByRole('region', { name: 'Março de 2027' })).not.toHaveAttribute('data-current-month')
  })
})
