import { t } from '@/i18n'
import { ViewSwitch } from './ViewSwitch'

/** "Temporada" or "Geral". Each is a page of its own, so the choice can be linked to. */
export function PeriodSwitch({ seasonTo, allTimeTo, allTime }: { seasonTo: string; allTimeTo: string; allTime: boolean }) {
  return (
    <ViewSwitch
      label={t.components.periodSwitch.label}
      options={[
        { label: t.common.season, to: seasonTo, current: !allTime },
        { label: t.components.periodSwitch.allTime, to: allTimeTo, current: allTime },
      ]}
    />
  )
}
