import { useState } from 'react'
import type { Statistics } from '@/api/client'
import { Button } from '@/components/Button'
import { PlayerLink } from '@/components/PlayerLink'
import { PlayerThumbnail } from '@/components/PlayerThumbnail'
import { highestCounts, PositionCount } from '@/components/PositionCount'
import { RankCell } from '@/components/RankedList'
import { t } from '@/i18n'
import { ordinal } from '@/lib/format'

/** How many lines show at first. */
const FIRST = 10
/** How many lines show at most, on request: a league with many players would make the table too long. */
const MOST = 30

/**
 * "Posições" as a medal table: a line per player and a column per scoring position, with the times the player
 * finished there. The API orders it: most 1st places first, then most 2nd places, and so on.
 * It shows the first ten lines, and on request up to thirty. The highest number of each column is marked, and a
 * position the player never reached shows a dash.
 */
export function PositionTable({ rows }: { rows: Statistics['position_table'] }) {
  const [all, setAll] = useState(false)
  const positions = rows[0]?.positions.map((p) => p.position) ?? []
  const shown = rows.slice(0, all ? MOST : FIRST)
  // The highest number of each column, among every line: also the ones not shown.
  const highest = highestCounts(rows)

  return (
    <>
      {/* relative: the texts for screen readers are positioned, and must scroll with the table, not widen the page. */}
      <div className="relative overflow-x-auto">
        {/* On a wide screen the table is only as wide as it needs, so the numbers stay near the names. */}
        <table className="w-full border-collapse text-sm sm:w-auto">
          <caption className="sr-only">{t.statistics.positionTableCaption}</caption>
          <thead>
            <tr className="border-b border-border text-xs uppercase text-muted">
              <th scope="col" className="w-6 py-2 text-left">#</th>
              <th scope="col" className="py-2 text-left">{t.common.player}</th>
              {positions.map((position) => (
                <th key={position} scope="col" className="px-1 py-2 text-center font-display text-sm font-extrabold text-text sm:w-14">{ordinal(position)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, i) => (
              <tr key={row.player.id} className="border-b border-border/60 last:border-0 even:bg-surface-stripe">
                {/* The line after the last one shown counts too: it may be tied with it. */}
                <RankCell compact rank={row.rank} tied={rows[i - 1]?.rank === row.rank || rows[i + 1]?.rank === row.rank} />
                {/* max-w-0: a long name is cut short instead of widening the table. */}
                <td className="w-full max-w-0 py-1 sm:w-56 sm:max-w-56 sm:pr-4">
                  <span className="flex items-center gap-2">
                    <PlayerThumbnail player={row.player} size="xs" />
                    <PlayerLink player={row.player} className="min-w-0 truncate font-semibold" />
                  </span>
                </td>
                {row.positions.map((p, column) => (
                  <td key={p.position} className="px-1 py-1 text-center tabular">
                    <PositionCount count={p.count} highest={highest[column]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > FIRST && (
        <Button variant="ghost" className="mt-2" aria-expanded={all} onPress={() => setAll(!all)}>
          {t.statistics.showFirst({ count: all ? FIRST : Math.min(rows.length, MOST) })}
        </Button>
      )}
    </>
  )
}
