import { Link } from 'react-router'
import type { Night } from '@/api/client'
import { Podium } from '@/components/Podium'
import { t } from '@/i18n'
import { titleOfNight } from '@/lib/format'
import { useSeasonPath } from '@/lib/seasonPath'

/** The first three of a season's finished Main Event, above the standings, with the way to "Main Event". */
export function MainEventPodium({ night }: { night: Night }) {
  const to = useSeasonPath()
  return (
    <Podium
      title={t.mainEvent.title}
      caption={t.mainEvent.resultCaption({ night: titleOfNight(night) })}
      action={<Link to={to('/main-event')} className="inline-flex min-h-touch items-center text-sm font-semibold text-primary underline">{t.mainEvent.seeMainEvent}</Link>}
      lines={(night.main_event_positions ?? []).map((line) => ({ rank: line.position, player: line.player }))}
    />
  )
}
