import { describe, expect, it } from 'vitest'
import type { NightDashboard } from '@/api/client'
import { nightDashboard, players } from '@/mocks/data'
import { amountsInUse, applyChange, hasPayments, nextPayment, recalculated } from './dashboardMoney'

// The same rules as the API, so that a tap shows at once what the API will answer
// (docs/specs/night-dashboard.md, the example "A night": Ana, Breno, Carlão, Dudu and Estela, at Estela's house).

const [ana, breno, carlao, dudu, estela, fausto] = players
const line = (dashboard: NightDashboard, id: number) => dashboard.players.find((l) => l.player.id === id)!

describe('recalculated', () => {
  it('adds the buy-ins and every rebuy up as the pot, and keeps the time chip apart', () => {
    expect(nightDashboard.totals).toEqual({
      pot: { owed: '425.00', paid: '275.00', pending: '150.00' },
      time_chip: { owed: '25.00', paid: '20.00', pending: '5.00' },
      total: { owed: '450.00', paid: '295.00', pending: '155.00' },
    })
  })

  it('charges the owner of the house the smaller buy-in, and says what each player has pending', () => {
    expect(line(nightDashboard, estela.id)).toMatchObject({ is_house_owner: true, buy_in: '25.00', pending: '0.00' })
    expect(line(nightDashboard, breno.id)).toMatchObject({ buy_in: '50.00', owed: '215.00', paid: '160.00', pending: '55.00' })
  })

  it('has no time chip on a site without it', () => {
    const { totals } = recalculated({ ...nightDashboard, totals: { ...nightDashboard.totals, time_chip: null } })

    expect(totals.time_chip).toBeNull()
    expect(totals.total).toEqual(totals.pot)
  })

  it('charges the time chip only of the late players when a rebuy does not pay it', () => {
    const { totals } = recalculated({ ...nightDashboard, prices: { ...nightDashboard.prices, rebuy_charges_time_chip: false } })

    expect(totals.time_chip).toEqual({ owed: '5.00', paid: '5.00', pending: '0.00' })
  })
})

describe('applyChange', () => {
  it('marks a buy-in as paid', () => {
    const after = applyChange(nightDashboard, { type: 'mark', player: dudu, buy_in_paid: true })

    expect(line(after, dudu.id)).toMatchObject({ buy_in_paid: true, pending: '0.00' })
    expect(after.totals.pot.paid).toBe('325.00')
  })

  it('adds a player who was not on the night, in the order of the names', () => {
    const after = applyChange(nightDashboard, { type: 'mark', player: fausto })

    expect(after.players.map((l) => l.player.nickname)).toEqual(['Ana', 'Breno', 'Carlão', 'Dudu', 'Estela', 'Fausto'])
    expect(line(after, fausto.id)).toMatchObject({ buy_in_paid: false, owed: '50.00' })
    expect(after.totals.pot.owed).toBe('475.00')
  })

  it('marks a time chip that is paid as owed, and one that is not owed as not paid', () => {
    const paid = applyChange(nightDashboard, { type: 'mark', player: dudu, time_chip_paid: true })
    expect(line(paid, dudu.id)).toMatchObject({ time_chip: true, time_chip_paid: true })

    const notOwed = applyChange(paid, { type: 'mark', player: dudu, time_chip: false })
    expect(line(notOwed, dudu.id)).toMatchObject({ time_chip: false, time_chip_paid: false })
    expect(notOwed.totals).toEqual(nightDashboard.totals)
  })

  it('adds a rebuy that is not paid, with the time chip it charges', () => {
    const after = applyChange(nightDashboard, { type: 'addRebuy', player: ana, count: 1 })

    expect(line(after, ana.id).rebuys).toEqual([{ id: 1, paid: true, non_cash: false }, { id: 0, paid: false, non_cash: false }])
    expect(after.totals.pot.pending).toBe('200.00')
    expect(after.totals.time_chip?.pending).toBe('10.00')
  })

  it('marks one rebuy as paid, and removes one', () => {
    const paid = applyChange(nightDashboard, { type: 'markRebuy', player: breno, index: 2, id: 4, paid: true })
    expect(line(paid, breno.id).pending).toBe('0.00')

    const removed = applyChange(nightDashboard, { type: 'removeRebuy', player: breno, index: 2, id: 4 })
    expect(line(removed, breno.id).rebuys).toHaveLength(2)
    expect(removed.totals.total.pending).toBe('100.00')
  })

  it('changes who owns the house, and what they owe', () => {
    const after = applyChange(nightDashboard, { type: 'houseOwner', player: carlao })

    expect(after.house_owner).toBe(carlao)
    expect(line(after, carlao.id)).toMatchObject({ is_house_owner: true, buy_in: '25.00' })
    expect(line(after, estela.id)).toMatchObject({ is_house_owner: false, buy_in: '50.00' })

    expect(applyChange(nightDashboard, { type: 'houseOwner', player: null }).totals.pot.owed).toBe('450.00')
  })

  it('removes a player, and the house owner with them', () => {
    const after = applyChange(nightDashboard, { type: 'removePlayer', player: estela })

    expect(after.players.map((l) => l.player.nickname)).toEqual(['Ana', 'Breno', 'Carlão', 'Dudu'])
    expect(after.house_owner).toBeNull()
  })

  it('fills and empties one position, leaving the others', () => {
    const filled = applyChange(nightDashboard, { type: 'position', position: 5, player: fausto })
    expect(filled.positions).toEqual([{ position: 5, player: fausto }, { position: 6, player: dudu }])
    // A player put in a position is on the night.
    expect(filled.players.map((l) => l.player.id)).toContain(fausto.id)

    expect(applyChange(filled, { type: 'position', position: 6, player: null }).positions).toEqual([{ position: 5, player: fausto }])
  })

  it('keeps the typed Main Event pot', () => {
    expect(applyChange(nightDashboard, { type: 'mainEventPot', amount: '90.00' }).main_event_pot).toBe('90.00')
  })
})

describe('payments not in cash', () => {
  // Ana paid her rebuy by bank transfer, and Breno his buy-in.
  const transfers = () =>
    applyChange(applyChange(nightDashboard, { type: 'markRebuy', player: ana, index: 0, id: 1, paid: true, non_cash: true }), { type: 'mark', player: breno, buy_in_paid: true, buy_in_non_cash: true })

  it('goes from not paid to paid in cash, to paid not in cash, and back', () => {
    expect(nextPayment(false, false)).toEqual({ paid: true, nonCash: false })
    expect(nextPayment(true, false)).toEqual({ paid: true, nonCash: true })
    expect(nextPayment(true, true)).toEqual({ paid: false, nonCash: false })
  })

  it('has everything in cash until a payment says otherwise', () => {
    expect(nightDashboard.received).toEqual({ cash: '295.00', non_cash: '0.00', non_cash_marked: '0.00', non_cash_adjustment: null })
  })

  it('splits what was paid, and leaves the pot and the time chip as they were', () => {
    const after = transfers()

    expect(after.received).toEqual({ cash: '190.00', non_cash: '105.00', non_cash_marked: '105.00', non_cash_adjustment: null })
    expect(after.players.map((l) => l.non_cash)).toEqual(['55.00', '50.00', '0.00', '0.00', '0.00'])
    expect(after.totals).toEqual(nightDashboard.totals)
  })

  it('counts a time chip as paid the way the buy-in was', () => {
    const transfer = applyChange(nightDashboard, { type: 'mark', player: carlao, buy_in_paid: true, buy_in_non_cash: true })
    expect(transfer.received.non_cash).toBe('55.00')

    const cash = applyChange(transfer, { type: 'mark', player: carlao, buy_in_paid: true, buy_in_non_cash: false })
    expect(cash.received.non_cash).toBe('0.00')
  })

  it('marks a payment that was not in cash as paid, and one that is not paid as paid in no way', () => {
    const paid = applyChange(nightDashboard, { type: 'mark', player: dudu, buy_in_non_cash: true })
    expect(line(paid, dudu.id)).toMatchObject({ buy_in_paid: true, buy_in_non_cash: true })
    const unpaid = applyChange(paid, { type: 'mark', player: dudu, buy_in_paid: false })
    expect(line(unpaid, dudu.id)).toMatchObject({ buy_in_paid: false, buy_in_non_cash: false })

    const rebuy = applyChange(nightDashboard, { type: 'markRebuy', player: breno, index: 2, id: 4, paid: false, non_cash: true })
    expect(line(rebuy, breno.id).rebuys[2]).toEqual({ id: 4, paid: true, non_cash: true })
    const again = applyChange(rebuy, { type: 'markRebuy', player: breno, index: 2, id: 4, paid: false })
    expect(line(again, breno.id).rebuys[2]).toEqual({ id: 4, paid: false, non_cash: false })
  })

  it('adds an amount typed by hand, also a negative one', () => {
    const marked = applyChange(nightDashboard, { type: 'mark', player: breno, buy_in_paid: true, buy_in_non_cash: true })

    expect(applyChange(marked, { type: 'nonCashAdjustment', amount: '-5.00' }).received).toEqual({ cash: '250.00', non_cash: '45.00', non_cash_marked: '50.00', non_cash_adjustment: '-5.00' })
    expect(applyChange(marked, { type: 'nonCashAdjustment', amount: '20.00' }).received).toMatchObject({ cash: '225.00', non_cash: '70.00' })
    expect(applyChange(applyChange(marked, { type: 'nonCashAdjustment', amount: '20.00' }), { type: 'nonCashAdjustment', amount: null }).received).toEqual(marked.received)
  })
})

describe('hasPayments', () => {
  it('is true with a mark or a rebuy, so the player cannot be removed', () => {
    expect(hasPayments(line(nightDashboard, dudu.id))).toBe(false)
    expect(hasPayments(line(nightDashboard, estela.id))).toBe(true)
    expect(hasPayments(line(nightDashboard, carlao.id))).toBe(true)
    expect(hasPayments({ ...line(nightDashboard, dudu.id), rebuys: [{ id: 9, paid: false, non_cash: false }] })).toBe(true)
  })
})

describe('amountsInUse', () => {
  it('is what the dashboard works out, with the season\'s share of the pot as the Main Event pot', () => {
    expect(amountsInUse(nightDashboard)).toEqual({ pot: '425.00', timeChip: '25.00', total: '450.00', mainEventPot: '85.00' })
  })

  it('takes an amount typed by hand in place of the one worked out, one at a time', () => {
    const typed = applyChange(nightDashboard, { type: 'amounts', pot: '600.00', time_chip: null })
    expect(typed.manual).toEqual({ pot: '600.00', time_chip: null })
    expect(amountsInUse(typed)).toMatchObject({ pot: '600.00', timeChip: '25.00', total: '625.00' })
    // What the players owe is still worked out.
    expect(typed.totals).toEqual(nightDashboard.totals)

    expect(amountsInUse({ ...nightDashboard, manual: { pot: null, time_chip: '40.00' } })).toMatchObject({ pot: '425.00', timeChip: '40.00', total: '465.00' })
  })

  it('takes a Main Event pot set by hand, and has none when the season sets no share', () => {
    expect(amountsInUse({ ...nightDashboard, main_event_pot: '90.00' }).mainEventPot).toBe('90.00')
    expect(amountsInUse({ ...nightDashboard, suggested_main_event_pot: null }).mainEventPot).toBeNull()
  })

  it('keeps no typed time chip on a site without it', () => {
    const noTimeChip = { ...nightDashboard, totals: { ...nightDashboard.totals, time_chip: null } }
    const typed = applyChange(noTimeChip, { type: 'amounts', pot: '600.00', time_chip: '40.00' })

    expect(typed.manual).toEqual({ pot: '600.00', time_chip: null })
    expect(amountsInUse(typed)).toMatchObject({ pot: '600.00', timeChip: null, total: '600.00' })
  })
})
