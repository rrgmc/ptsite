import { expect, it } from 'vitest'
import { players } from '@/mocks/data'
import { playerIdsOf, withEmptyRow } from './order'

const [ana, breno, carlao] = players

it('starts with one empty row, and adds one after the last player', () => {
  expect(withEmptyRow([])).toEqual([null])
  expect(withEmptyRow([ana])).toEqual([ana, null])
  expect(withEmptyRow([ana, breno, null])).toEqual([ana, breno, null])
})

it('closes the row of a removed player, so that no position is skipped', () => {
  expect(withEmptyRow([ana, null, carlao, null])).toEqual([ana, carlao, null])
})

it('sends the players in order, and nothing while nobody is chosen', () => {
  expect(playerIdsOf([ana, carlao, breno, null])).toEqual([ana.id, carlao.id, breno.id])
  expect(playerIdsOf([null])).toBeNull()
})
