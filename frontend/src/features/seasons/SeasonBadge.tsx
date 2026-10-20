import type { Season } from '@/api/client'
import { Badge } from '@/components/Feedback'
import { t } from '@/i18n'

/** Where a season stands: the current one, finished, open, or closed before it ended. A season known only by its final standings says so too. */
export function SeasonBadge({ season, isCurrent }: { season: Season; isCurrent: boolean }) {
  return (
    <>
      <StatusBadge season={season} isCurrent={isCurrent} />
      {season.totals_only && <Badge>{t.seasons.totalsOnly}</Badge>}
    </>
  )
}

function StatusBadge({ season, isCurrent }: { season: Season; isCurrent: boolean }) {
  if (isCurrent) return <Badge tone="primary">{t.seasons.current}</Badge>
  if (season.is_finished) return <Badge>{t.seasons.finished}</Badge>
  if (season.is_open) return <Badge tone="primary">{t.seasons.open}</Badge>
  return <Badge tone="warning">{t.seasons.closed}</Badge>
}
