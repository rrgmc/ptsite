import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { NightDashboard } from '@/api/client'
import { finishedNightDashboard } from '@/mocks/data'
import { DashboardPlayersCard } from './DashboardPlayersCard'

// A finished night's players on its page (docs/specs/night-dashboard.md): shown, never changed.

const view = (dashboard: NightDashboard = finishedNightDashboard) => render(<DashboardPlayersCard dashboard={dashboard} />)
const marksOf = (nickname: string) => within(screen.getByRole('group', { name: `Pagamentos de ${nickname}` }))

afterEach(cleanup)

describe('DashboardPlayersCard', () => {
  it('lists every participant, with nothing to tap', () => {
    view()
    expect(screen.getByRole('heading', { name: `Jogadores (${finishedNightDashboard.players.length})` })).toBeTruthy()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('says whether each buy-in and rebuy was paid, and how', () => {
    const [ana, breno] = finishedNightDashboard.players
    view({
      ...finishedNightDashboard,
      players: [{ ...ana, rebuys: [{ ...ana.rebuys[0], non_cash: true }] }, ...finishedNightDashboard.players.slice(1)],
    })
    expect(marksOf(ana.player.nickname).getByText('Buy-in: pago em dinheiro')).toBeTruthy()
    expect(marksOf(ana.player.nickname).getByText('Rebuy 1: pago fora do dinheiro')).toBeTruthy()
    expect(marksOf(breno.player.nickname).getByText('Rebuy 3: não pago')).toBeTruthy()
  })

  it('shows the time chip of a late arrival only', () => {
    const [ana, , late] = finishedNightDashboard.players
    view()
    expect(marksOf(late.player.nickname).getByText('Time chip: chegou atrasado')).toBeTruthy()
    expect(marksOf(late.player.nickname).getByText('Time chip: pago')).toBeTruthy()
    expect(marksOf(ana.player.nickname).queryByText(/^Time chip:/)).toBeNull()
  })

  it('leaves the time chip out on a site without it', () => {
    const late = finishedNightDashboard.players[2]
    view({ ...finishedNightDashboard, totals: { ...finishedNightDashboard.totals, time_chip: null } })
    expect(marksOf(late.player.nickname).queryByText(/^Time chip:/)).toBeNull()
  })
})
