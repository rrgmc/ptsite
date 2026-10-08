import type { NightDashboard, PartialResult, Player } from '@/api/client'
import { hasFeature } from '@/lib/features'
import { moneyText } from '@/lib/format'
import { amountsInUse } from '../dashboard/dashboardMoney'

/** What a result form starts from: the amounts as typed text, and the players in the order of the percentage table. */
export interface ResultSeed {
  potText: string
  mainEventPotText: string
  timeChipText: string
  order: (Player | null)[]
}

/** The form values for a partial result. Positions the season does not score are ignored. */
export function seedFromPartial(percentages: { position: number }[], partial: PartialResult): ResultSeed {
  return {
    potText: moneyText(partial.pot),
    mainEventPotText: moneyText(partial.main_event_pot),
    timeChipText: moneyText(partial.time_chip),
    order: percentages.map((p) => partial.positions.find((line) => line.position === p.position)?.player ?? null),
  }
}

/**
 * The form values for "Finalizar" on a site with the night dashboard: the pot and the time chip (the ones typed by
 * hand, or else the ones that are owed), the Main Event pot set by hand or else the season's share of the pot,
 * and the positions filled on the dashboard.
 */
export function seedFromDashboard(percentages: { position: number }[], dashboard: NightDashboard): ResultSeed {
  const { pot, timeChip, mainEventPot } = amountsInUse(dashboard)
  return {
    potText: Number(pot) > 0 ? moneyText(pot) : '',
    mainEventPotText: moneyText(mainEventPot),
    timeChipText: moneyText(timeChip),
    order: percentages.map((p) => dashboard.positions.find((line) => line.position === p.position)?.player ?? null),
  }
}

/** Nothing recorded: no amount and no position. An amount this site does not have is not looked at. */
export function isEmptyPartial(partial: PartialResult): boolean {
  return (
    partial.pot === null &&
    (partial.main_event_pot === null || !hasFeature('mainEventPot')) &&
    (partial.time_chip === null || !hasFeature('timeChip')) &&
    partial.positions.length === 0
  )
}
