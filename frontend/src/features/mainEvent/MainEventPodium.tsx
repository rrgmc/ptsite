import { Link } from 'react-router'
import type { Night } from '@/api/client'
import { PlayerLink } from '@/components/PlayerLink'
import { PlayerThumbnail } from '@/components/PlayerThumbnail'
import { t } from '@/i18n'
import { ordinal, titleOfNight } from '@/lib/format'
import { useSeasonPath } from '@/lib/seasonPath'

const medals = ['🥇', '🥈', '🥉']

/**
 * The first three of a season's finished Main Event, above the standings, with the way to "Main Event".
 * It is a band of three players side by side, not a table, so that it does not read as part of the standings.
 */
export function MainEventPodium({ night }: { night: Night }) {
  const podium = (night.main_event_positions ?? []).slice(0, medals.length)
  const to = useSeasonPath()
  return (
    <section className="min-w-0 rounded-lg border-2 border-primary bg-primary-soft p-3 sm:p-4">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-x-3">
        <h2 className="font-display text-lg font-bold"><span aria-hidden="true">🏆 </span>{t.mainEvent.title}</h2>
        <Link to={to('/main-event')} className="inline-flex min-h-touch items-center text-sm font-semibold text-primary underline">{t.mainEvent.seeMainEvent}</Link>
      </header>
      <ol aria-label={t.mainEvent.resultCaption({ night: titleOfNight(night) })} className="grid grid-cols-3 gap-2">
        {podium.map((line, i) => (
          <li key={line.position} className="flex min-w-0 flex-col items-center gap-1 rounded-md bg-surface p-2 text-center">
            <span className="text-sm font-bold text-muted tabular"><span aria-hidden="true">{medals[i]} </span>{ordinal(line.position)}</span>
            <PlayerThumbnail player={line.player} />
            <PlayerLink player={line.player} className={`max-w-full ${line.position === 1 ? 'font-bold' : 'font-semibold'}`} />
          </li>
        ))}
      </ol>
    </section>
  )
}
