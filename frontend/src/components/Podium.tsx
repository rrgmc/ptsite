import { useId, type ReactNode } from 'react'
import { PlayerLink } from './PlayerLink'
import { PlayerThumbnail } from './PlayerThumbnail'
import { medals, podiumLines, type PodiumLine } from './podiumLines'
import { ordinal } from '@/lib/format'

/**
 * The first three of a result, with a medal each, above the standings: the season's final standings
 * ("Campeonato") and its Main Event. It is a band of players side by side, not a table, so that it does not read
 * as part of the standings. `compact` makes it shorter, for the champions over every season in "Estatísticas",
 * where each line says how many titles the player has (`note`).
 */
export function Podium({ title, caption, action, lines, compact = false }: { title: string; caption: string; action?: ReactNode; lines: (PodiumLine & { note?: string })[]; compact?: boolean }) {
  const heading = useId()
  return (
    <section aria-labelledby={heading} className={`min-w-0 rounded-lg border-2 border-primary bg-primary-soft ${compact ? 'p-2 sm:p-3' : 'p-3 sm:p-4'}`}>
      <header className={`flex flex-wrap items-center justify-between gap-x-3 ${compact ? 'mb-2' : 'mb-3 min-h-touch'}`}>
        <h2 id={heading} className={`font-display font-bold ${compact ? 'text-base' : 'text-lg'}`}><span aria-hidden="true">🏆 </span>{title}</h2>
        {action}
      </header>
      <ol aria-label={caption} className="grid grid-cols-3 gap-2">
        {podiumLines(lines).map((line) => (
          <li key={line.player.id} className={`flex min-w-0 flex-col items-center rounded-md bg-surface text-center ${compact ? 'gap-0.5 p-1.5' : 'gap-1 p-2'}`}>
            <span className="text-sm font-bold text-muted tabular"><span aria-hidden="true">{medals[line.rank - 1]} </span>{ordinal(line.rank)}</span>
            <PlayerThumbnail player={line.player} size={compact ? 'sm' : 'md'} />
            <PlayerLink player={line.player} className={`max-w-full ${line.rank === 1 ? 'font-bold' : 'font-semibold'}`} />
            {line.note && <span className="text-sm text-muted tabular">{line.note}</span>}
          </li>
        ))}
      </ol>
    </section>
  )
}
