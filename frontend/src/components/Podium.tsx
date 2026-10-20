import { useId, type ReactNode } from 'react'
import { PlayerLink } from './PlayerLink'
import { PlayerThumbnail } from './PlayerThumbnail'
import { medals, podiumLines, type PodiumLine } from './podiumLines'
import { ordinal } from '@/lib/format'

type Line = PodiumLine & { note?: string }

/**
 * The first three of a result, with a medal each, above the standings: the season's final standings
 * ("Campeonato") and its Main Event. It is a band of players side by side, not a table, so that it does not read
 * as part of the standings. `compact` makes it shorter, for the champions over every season in "Estatísticas":
 * one line per place, with every player who shares it and the place's `note` (how many titles).
 */
export function Podium({ title, caption, action, lines, compact = false }: { title: string; caption: string; action?: ReactNode; lines: Line[]; compact?: boolean }) {
  const heading = useId()
  return (
    <section aria-labelledby={heading} className={`min-w-0 rounded-lg border-2 border-primary bg-primary-soft ${compact ? 'p-2 sm:p-3' : 'p-3 sm:p-4'}`}>
      <header className={`flex flex-wrap items-center justify-between gap-x-3 ${compact ? 'mb-2' : 'mb-3 min-h-touch'}`}>
        <h2 id={heading} className={`font-display font-bold ${compact ? 'text-base' : 'text-lg'}`}><span aria-hidden="true">🏆 </span>{title}</h2>
        {action}
      </header>
      {compact ? (
        <ol aria-label={caption} className="flex flex-col gap-2">
          {places(podiumLines(lines)).map((place) => (
            <li key={place[0].rank} className="flex min-w-0 items-center gap-3 rounded-md bg-surface p-2">
              <span className="flex w-16 shrink-0 flex-col items-center text-center">
                <span className="text-sm font-bold text-muted tabular"><span aria-hidden="true">{medals[place[0].rank - 1]} </span>{ordinal(place[0].rank)}</span>
                {place[0].note && <span className="text-xs text-muted tabular">{place[0].note}</span>}
              </span>
              {/* Equal columns, so the players who share a place line up as in a table. */}
              <ul className="grid min-w-0 flex-1 grid-cols-[repeat(auto-fill,minmax(6.5rem,1fr))] gap-x-3 gap-y-1">
                {place.map((line) => (
                  <li key={line.player.id} className="flex min-w-0 items-center gap-1.5">
                    <PlayerThumbnail player={line.player} size="xs" />
                    <PlayerLink player={line.player} className={`min-w-0 truncate ${line.rank === 1 ? 'font-bold' : 'font-semibold'}`} />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      ) : (
        <ol aria-label={caption} className="grid grid-cols-3 gap-2">
          {podiumLines(lines).map((line) => (
            <li key={line.player.id} className="flex min-w-0 flex-col items-center gap-1 rounded-md bg-surface p-2 text-center">
              <span className="text-sm font-bold text-muted tabular"><span aria-hidden="true">{medals[line.rank - 1]} </span>{ordinal(line.rank)}</span>
              <PlayerThumbnail player={line.player} />
              <PlayerLink player={line.player} className={`max-w-full ${line.rank === 1 ? 'font-bold' : 'font-semibold'}`} />
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

/** The lines grouped by place, in order: the players who share a place are together. */
function places(lines: Line[]): Line[][] {
  const groups = new Map<number, Line[]>()
  for (const line of lines) groups.set(line.rank, [...(groups.get(line.rank) ?? []), line])
  return [...groups.values()]
}
