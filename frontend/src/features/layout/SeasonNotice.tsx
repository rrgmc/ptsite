import type { Season } from '@/api/client'
import { Button } from '@/components/Button'
import { t } from '@/i18n'
import { rich } from '@/i18n/rich'

/** Tells the user that the season on screen is not the current one, with the way back. */
export function SeasonNotice({ season, onBack }: { season: Season; onBack: () => void }) {
  return (
    <aside aria-label={t.layout.seasonNotice.label} className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md bg-warning-soft p-3 text-warning">
      <p className="min-w-0 wrap-anywhere">
        {rich(t.layout.seasonNotice.viewing, { season: <strong>{season.name}</strong> })}
      </p>
      <Button variant="secondary" onPress={onBack}>{t.layout.seasonNotice.backToCurrent}</Button>
    </aside>
  )
}
