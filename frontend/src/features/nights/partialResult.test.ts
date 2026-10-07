import { describe, expect, it } from 'vitest'
import type { PartialResult } from '@/api/client'
import { players } from '@/mocks/data'
import { isEmptyPartial, seedFromPartial } from './partialResult'

const percentages = [38, 23, 15, 11, 8, 5].map((percent, i) => ({ position: i + 1, percent }))
const empty: PartialResult = { pot: null, main_event_pot: null, time_chip: null, positions: [], saved_by: null, saved_at: null }

describe('seedFromPartial', () => {
  it('fills the amounts with a comma and the given positions, leaving the others empty', () => {
    const seed = seedFromPartial(percentages, {
      ...empty,
      pot: '840.00',
      time_chip: '0.00',
      positions: [{ position: 5, player: players[3] }, { position: 6, player: players[1] }],
    })

    expect(seed.potText).toBe('840,00')
    expect(seed.mainEventPotText).toBe('')
    expect(seed.timeChipText).toBe('0,00')
    expect(seed.order).toEqual([null, null, null, null, players[3], players[1]])
  })

  it('ignores positions outside the percentage table', () => {
    const seed = seedFromPartial(percentages, { ...empty, positions: [{ position: 7, player: players[0] }] })

    expect(seed.order).toEqual([null, null, null, null, null, null])
  })
})

describe('isEmptyPartial', () => {
  it('is empty with no amount and no positions', () => {
    expect(isEmptyPartial(empty)).toBe(true)
    expect(isEmptyPartial({ ...empty, time_chip: '0.00' })).toBe(false)
    expect(isEmptyPartial({ ...empty, positions: [{ position: 1, player: players[0] }] })).toBe(false)
  })
})
