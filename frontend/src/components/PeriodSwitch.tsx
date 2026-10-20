import { t } from '@/i18n'
import { ViewSwitch } from './ViewSwitch'

/**
 * "Temporada" or "Geral". Each is a page of its own, so the choice can be linked to. `allTimeFirst` puts "Geral"
 * first, where it is the view that opens by default.
 */
export function PeriodSwitch({ seasonTo, allTimeTo, allTime, allTimeFirst = false }: { seasonTo: string; allTimeTo: string; allTime: boolean; allTimeFirst?: boolean }) {
  const season = { label: t.common.season, to: seasonTo, current: !allTime }
  const allSeasons = { label: t.components.periodSwitch.allTime, to: allTimeTo, current: allTime }
  return <ViewSwitch label={t.components.periodSwitch.label} options={allTimeFirst ? [allSeasons, season] : [season, allSeasons]} />
}
