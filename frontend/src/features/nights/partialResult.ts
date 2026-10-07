import type { PartialResult, Player } from '@/api/client'

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

/** Nothing recorded: no amount and no position. */
export function isEmptyPartial(partial: PartialResult): boolean {
  return partial.pot === null && partial.main_event_pot === null && partial.time_chip === null && partial.positions.length === 0
}
