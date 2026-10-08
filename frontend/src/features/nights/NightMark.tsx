import type { Night } from '@/api/client'
import { Badge } from '@/components/Feedback'
import { t } from '@/i18n'

/** What marks a night that is not a round of the season: "Main Event" or "Extra". A round has no mark. */
export function NightMark({ night }: { night: Pick<Night, 'type' | 'is_extra'> }) {
  if (night.type === 'main_event') return <Badge tone="warning">{t.nights.marks.mainEvent}</Badge>
  return night.is_extra ? <Badge>{t.nights.marks.extra}</Badge> : null
}
