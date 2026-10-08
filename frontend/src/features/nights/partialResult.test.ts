import { afterEach, describe, expect, it } from 'vitest'
import type { PartialResult } from '@/api/client'
import { overrideFeatures } from '@/lib/features'
import { nightDashboard, players } from '@/mocks/data'
import { isEmptyPartial, seedFromDashboard, seedFromPartial } from './partialResult'

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

  let restore = () => {}
  afterEach(() => restore())

  it('does not look at an amount the site does not have', () => {
    restore = overrideFeatures({ timeChip: false })

    expect(isEmptyPartial({ ...empty, time_chip: '0.00' })).toBe(true)
    expect(isEmptyPartial({ ...empty, main_event_pot: '0.00' })).toBe(false)
  })
})

describe('seedFromDashboard', () => {
  it('fills the pot and the time chip that are owed, the suggested Main Event pot and the positions', () => {
    const seed = seedFromDashboard(percentages, nightDashboard)

    expect(seed.potText).toBe('425,00')
    expect(seed.timeChipText).toBe('25,00')
    expect(seed.mainEventPotText).toBe('85,00')
    expect(seed.order).toEqual([null, null, null, null, null, players[3]])
  })

  it('prefers a typed Main Event pot to the suggested one', () => {
    expect(seedFromDashboard(percentages, { ...nightDashboard, main_event_pot: '90.00' }).mainEventPotText).toBe('90,00')
  })

  it('leaves empty what the dashboard does not have: no players yet, no time chip on the site, no share of the pot', () => {
    const totals = { pot: { owed: '0.00', paid: '0.00', pending: '0.00' }, time_chip: null, total: { owed: '0.00', paid: '0.00', pending: '0.00' } }
    const seed = seedFromDashboard(percentages, { ...nightDashboard, totals, suggested_main_event_pot: null, positions: [] })

    expect(seed).toEqual({ potText: '', mainEventPotText: '', timeChipText: '', order: [null, null, null, null, null, null] })
  })
})
