import type { NightDashboard, PartialResult, Player } from '@/api/client'
import { hasFeature } from '@/lib/features'

/** What a result form starts from: the amounts as typed text, and the players in the order of the percentage table. */
export interface ResultSeed {
  potText: string
  mainEventPotText: string
  timeChipText: string
  order: (Player | null)[]
}

/** "840.00" → "840,00", as typed in a money field; nothing when the amount is not known. */
export function moneyText(amount: string | null | undefined): string {
  return amount ? amount.replace('.', ',') : ''
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
 * The form values for "Finalizar" on a site with the night dashboard: the pot and the time chip that are owed,
 * the typed Main Event pot or else the one the season suggests, and the positions filled on the dashboard.
 */
export function seedFromDashboard(percentages: { position: number }[], dashboard: NightDashboard): ResultSeed {
  return {
    potText: Number(dashboard.totals.pot.owed) > 0 ? moneyText(dashboard.totals.pot.owed) : '',
    mainEventPotText: moneyText(dashboard.main_event_pot ?? dashboard.suggested_main_event_pot),
    timeChipText: moneyText(dashboard.totals.time_chip?.owed),
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
