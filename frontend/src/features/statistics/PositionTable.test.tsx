import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import type { Statistics } from '@/api/client'
import { players } from '@/mocks/data'
import { PositionTable } from './PositionTable'

// "Posições" of the statistics (docs/specs/statistics.md, rule 3c): how many lines it shows.

/** A table of `count` players, each with one 1st place fewer than the one before. */
function table(count: number): Statistics['position_table'] {
  return Array.from({ length: count }, (_, i) => ({
    rank: i + 1,
    player: { ...players[0], id: i + 1, nickname: `Jogador ${i + 1}` },
    positions: [{ position: 1, count: count - i }, { position: 2, count: 0 }],
  }))
}

function view(count: number) {
  render(<MemoryRouter><PositionTable rows={table(count)} /></MemoryRouter>)
}

/** The lines of the table, without its header. */
const lines = () => screen.getAllByRole('row').length - 1

afterEach(cleanup)

describe('PositionTable', () => {
  it('shows every line of a short table, with no button', () => {
    view(10)

    expect(lines()).toBe(10)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('shows the first ten lines, then all twelve, then the first ten again', async () => {
    view(12)

    expect(lines()).toBe(10)
    await userEvent.click(screen.getByRole('button', { name: 'Ver os 12 primeiros' }))
    expect(lines()).toBe(12)
    await userEvent.click(screen.getByRole('button', { name: 'Ver os 10 primeiros' }))
    expect(lines()).toBe(10)
  })

  it('shows thirty lines at most, and the button says thirty', async () => {
    view(35)

    await userEvent.click(screen.getByRole('button', { name: 'Ver os 30 primeiros' }))
    expect(lines()).toBe(30)
    expect(screen.getByRole('link', { name: 'Jogador 30' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Jogador 31' })).toBeNull()
  })

  it('marks the highest number of a position and shows a dash for a position never reached', () => {
    view(3)

    const [first, second] = screen.getAllByRole('row').slice(1)
    expect(first).toHaveTextContent('(o maior da posição)')
    expect(second).not.toHaveTextContent('(o maior da posição)')
    expect(first).toHaveTextContent('–')
  })
})
