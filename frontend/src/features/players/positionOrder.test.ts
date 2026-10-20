import { describe, expect, it } from 'vitest'
import { players, statistics } from '@/mocks/data'
import { byPositionTable } from './positionOrder'

describe('byPositionTable', () => {
  it('puts the players in the order of the position table', () => {
    // Ana, Breno, Carlão and Helena, in the order of the list.
    const shown = [players[0], players[1], players[2], players[7]]
    expect(byPositionTable(shown, statistics.position_table).map((p) => p.nickname)).toEqual(['Ana', 'Carlão', 'Breno', 'Helena'])
  })

  it('puts the players who are not in the table last, in the order they came in', () => {
    const table = statistics.position_table.filter((row) => row.player.id === 3)
    expect(byPositionTable(players.slice(0, 3), table).map((p) => p.nickname)).toEqual(['Carlão', 'Ana', 'Breno'])
  })

  it('keeps the order with an empty table', () => {
    expect(byPositionTable(players, [])).toEqual(players)
  })
})
