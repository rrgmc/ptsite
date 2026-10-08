import type { Standing } from '@/api/client'
import { PlayerLink } from '@/components/PlayerLink'
import { PlayerThumbnail } from '@/components/PlayerThumbnail'
import { highestCounts, PositionCount } from '@/components/PositionCount'
import { t } from '@/i18n'
import { RankCell } from '@/components/RankedList'
import { formatPoints, ordinal } from '@/lib/format'

/**
 * The standings, by total points. Between the player and the points there is a column for each scoring position,
 * with the times the player finished there, as in "Posições" of the statistics. A phone has no room for those
 * columns: it says the nights scored and the wins under the nickname.
 */
export function StandingsTable({ rows, caption }: { rows: Standing[]; caption: string }) {
  const positions = rows[0]?.positions.map((p) => p.position) ?? []
  const highest = highestCounts(rows)
  // With very large text and a wide font, the table scrolls sideways inside its card instead of widening the page.
  // relative: the texts for screen readers are positioned, and must scroll with the table, not widen the page.
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase text-muted">
            <th scope="col" className="w-8 px-1 py-2 sm:w-12 sm:px-2">#</th>
            <th scope="col" className="py-2">{t.common.player}</th>
            {positions.map((position) => (
              <th key={position} scope="col" className="hidden w-11 px-1 py-2 text-center font-display text-sm font-extrabold text-text sm:table-cell">{ordinal(position)}</th>
            ))}
            <th scope="col" className="py-2 pr-2 text-right sm:pl-3">{t.common.points}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const tied = rows[i - 1]?.rank === row.rank || rows[i + 1]?.rank === row.rank
            return (
              <tr key={row.player.id} className="border-b border-border/60 last:border-0 even:bg-surface-stripe">
                <RankCell rank={row.rank} tied={tied} />
                <td className="py-2">
                  <span className="flex items-center gap-2 sm:gap-3">
                    <PlayerThumbnail player={row.player} />
                    <span className="min-w-0">
                      <PlayerLink player={row.player} />
                      {/* Each half stays whole, so a narrow column breaks the line between them. */}
                      <span className="block text-xs text-muted sm:hidden">
                        <span className="inline-block whitespace-nowrap">{t.standings.nightsCount({ count: row.nights_scored })}</span>
                        {' · '}
                        <span className="inline-block whitespace-nowrap">{t.standings.winsCount({ count: row.wins })}</span>
                      </span>
                    </span>
                  </span>
                </td>
                {row.positions.map((p, column) => (
                  <td key={p.position} className="hidden px-1 py-3 text-center text-sm tabular sm:table-cell">
                    <PositionCount count={p.count} highest={highest[column]} />
                  </td>
                ))}
                <td className="py-3 pr-2 text-right font-bold tabular sm:pl-3">{formatPoints(row.points)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
