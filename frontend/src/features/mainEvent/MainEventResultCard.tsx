import { Link } from 'react-router'
import type { Night } from '@/api/client'
import { PlayerLink } from '@/components/PlayerLink'
import { PlayerThumbnail } from '@/components/PlayerThumbnail'
import { t } from '@/i18n'
import { ordinal, titleOfNight } from '@/lib/format'

/** The players of a finished Main Event in finishing order. There is no pot and there are no points. */
export function MainEventPositions({ night }: { night: Night }) {
  return (
    <ol aria-label={t.mainEvent.resultCaption({ night: titleOfNight(night) })} className="divide-y divide-border/60">
      {night.main_event_positions?.map((line) => (
        <li key={line.position} className="flex items-center gap-2 px-1 py-1 even:bg-surface-stripe sm:px-2 sm:py-1.5">
          <span className="w-7 shrink-0 font-bold text-muted tabular sm:w-8">{ordinal(line.position)}</span>
          <PlayerThumbnail player={line.player} size="sm" />
          <PlayerLink player={line.player} className={`min-w-0 ${line.position === 1 ? 'font-bold' : ''}`} />
        </li>
      ))}
    </ol>
  )
}

/** A finished Main Event night, as a card among the season's results. */
export function MainEventResultCard({ night }: { night: Night }) {
  return (
    <article className="rounded-lg bg-surface p-2 shadow-card sm:p-4">
      <header className="mb-2 px-1 sm:px-0">
        <h3 className="font-display font-bold">
          <Link to={`/nights/${night.id}`} className="hover:underline">{titleOfNight(night)}</Link>
        </h3>
      </header>
      <MainEventPositions night={night} />
    </article>
  )
}
