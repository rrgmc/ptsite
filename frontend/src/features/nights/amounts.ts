import { t } from '@/i18n'
import { hasFeature } from '@/lib/features'

type Amount = string | null | undefined

/** The amounts of a night, or their totals, as the rows of a list: the pot, then the ones this site has. */
export function amountRows({ pot, mainEventPot, timeChip }: { pot: Amount; mainEventPot: Amount; timeChip: Amount }): [label: string, amount: Amount][] {
  return [
    [t.nights.amounts.potTotal, pot],
    ...(hasFeature('mainEventPot') ? [[t.nights.amounts.mainEventPot, mainEventPot] as [string, Amount]] : []),
    ...(hasFeature('timeChip') ? [[t.nights.amounts.timeChip, timeChip] as [string, Amount]] : []),
  ]
}
