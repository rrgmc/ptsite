import { useId, type ReactNode } from 'react'
import { PlayerLink } from './PlayerLink'
import { PlayerThumbnail } from './PlayerThumbnail'
import { medals, podiumLines, type PodiumLine } from './podiumLines'
import { ordinal } from '@/lib/format'

/**
 * The first three of a result, with a medal each, above the standings: the season's final standings
 * ("Campeonato") and its Main Event. It is a band of players side by side, not a table, so that it does not read
 * as part of the standings.
 */
export function Podium({ title, caption, action, lines }: { title: string; caption: string; action?: ReactNode; lines: PodiumLine[] }) {
  const heading = useId()
  return (
    <section aria-labelledby={heading} className="min-w-0 rounded-lg border-2 border-primary bg-primary-soft p-3 sm:p-4">
      <header className="mb-3 flex min-h-touch flex-wrap items-center justify-between gap-x-3">
        <h2 id={heading} className="font-display text-lg font-bold"><span aria-hidden="true">🏆 </span>{title}</h2>
        {action}
      </header>
      <ol aria-label={caption} className="grid grid-cols-3 gap-2">
        {podiumLines(lines).map((line) => (
          <li key={line.player.id} className="flex min-w-0 flex-col items-center gap-1 rounded-md bg-surface p-2 text-center">
            <span className="text-sm font-bold text-muted tabular"><span aria-hidden="true">{medals[line.rank - 1]} </span>{ordinal(line.rank)}</span>
            <PlayerThumbnail player={line.player} />
            <PlayerLink player={line.player} className={`max-w-full ${line.rank === 1 ? 'font-bold' : 'font-semibold'}`} />
          </li>
        ))}
      </ol>
    </section>
  )
}
