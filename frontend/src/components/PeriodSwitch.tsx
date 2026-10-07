import { ViewSwitch } from './ViewSwitch'

/** "Temporada" or "Geral". Each is a page of its own, so the choice can be linked to. */
export function PeriodSwitch({ seasonTo, allTimeTo, allTime }: { seasonTo: string; allTimeTo: string; allTime: boolean }) {
  return (
    <ViewSwitch
      label="Período"
      options={[
        { label: 'Temporada', to: seasonTo, current: !allTime },
        { label: 'Geral', to: allTimeTo, current: allTime },
      ]}
    />
  )
}
