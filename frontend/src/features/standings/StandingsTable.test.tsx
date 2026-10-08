import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { standings } from '@/mocks/data'
import { StandingsTable } from './StandingsTable'

// The standings table (docs/specs/points-and-standings.md, rule 5a): a column for each scoring position.

afterEach(cleanup)

describe('StandingsTable', () => {
  it('has a column for each scoring position between the player and the points', () => {
    render(<MemoryRouter><StandingsTable rows={standings} caption="Classificação" /></MemoryRouter>)

    // The position columns are hidden on a phone by a style, which this test does not load.
    const headers = screen.getAllByRole('columnheader', { hidden: true }).map((th) => th.textContent)
    expect(headers).toEqual(['#', 'Jogador', '1º', '2º', '3º', '4º', '5º', '6º', 'Pontos'])
  })

  it('keeps the order by points, marks the highest of a position and shows a dash for none', () => {
    render(<MemoryRouter><StandingsTable rows={standings} caption="Classificação" /></MemoryRouter>)

    const [first, second, third] = screen.getAllByRole('row').slice(1)
    expect(within(first).getByRole('link')).toHaveTextContent('Breno')
    expect(within(second).getByRole('link')).toHaveTextContent('Ana')
    // Breno: one 1st place, tied for the most, and one 2nd place, tied for the most too. No 3rd place.
    const cells = within(first).getAllByRole('cell', { hidden: true })
    expect(cells[2]).toHaveTextContent('1 (o maior da posição)')
    expect(cells[4]).toHaveTextContent('–')
    expect(cells.at(-1)).toHaveTextContent('183,00')
    // Carlão has no 1st place: nothing is marked there.
    expect(within(third).getAllByRole('cell', { hidden: true })[2]).not.toHaveTextContent('(o maior da posição)')
  })
})
