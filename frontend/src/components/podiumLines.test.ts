import { expect, it } from 'vitest'
import { players, standings } from '@/mocks/data'
import { podiumLines } from './podiumLines'

// The box "Campeonato" of a finished season (docs/specs/points-and-standings.md, rule 9).

const line = (rank: number, player: number) => ({ rank, player: players[player] })

it('keeps the first three places', () => {
  expect(podiumLines([line(1, 1), line(2, 0), line(3, 2), line(4, 3)]).map((l) => l.player.nickname)).toEqual([players[1], players[0], players[2]].map((p) => p.nickname))
})

it('keeps every player who shares a place, so it can show more than three', () => {
  // Two players share the 3rd place of the demo standings.
  expect(podiumLines(standings).map((l) => l.rank)).toEqual([1, 2, 3, 3])
  // A shared 1st place: 🥇 1º, 🥇 1º, 🥉 3º.
  expect(podiumLines([line(1, 0), line(1, 1), line(3, 2), line(4, 3)]).map((l) => l.rank)).toEqual([1, 1, 3])
})

it('shows fewer players when fewer were recorded', () => {
  expect(podiumLines([line(1, 2)])).toHaveLength(1)
})
