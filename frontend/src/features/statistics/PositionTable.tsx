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
/** How many scoring positions fit beside the nickname on a phone. */
const BESIDE = 4
/** How many lines show at most, on request: a league with many players would make the table too long. */
const MOST = 30

/**
 * "Posições" as a medal table: a line per player and a column per scoring position, with the times the player
 * finished there. The API orders it: most 1st places first, then most 2nd places, and so on.
 * It shows the first ten lines, and on request up to thirty. The highest number of each column is marked, and a
 * position the player never reached shows a dash. On a phone, with more than four positions, each player takes
 * two lines: the nickname, then the numbers.
 */
export function PositionTable({ rows }: { rows: Statistics['position_table'] }) {
  const [all, setAll] = useState(false)
  const positions = rows[0]?.positions.map((p) => p.position) ?? []
  const shown = rows.slice(0, all ? MOST : FIRST)
  // The highest number of each column, among every line: also the ones not shown.
  const highest = highestCounts(rows)

  // On a phone each line is a grid: the same columns on every line, so the numbers stay under their headers.
  // Many positions do not fit beside the nickname: it then has a line of its own, over the player's numbers,
  // which share the width. With very large text the columns keep a least width and the table scrolls sideways.
  const stacked = positions.length > BESIDE
  const columns = {
    gridTemplateColumns: stacked
      ? `1.5rem repeat(${positions.length}, minmax(1.5rem, 1fr))`
      : `1.5rem minmax(0, 1fr) repeat(${positions.length}, 2.5rem)`,
  }

  return (
    <>
      {/* relative: the texts for screen readers are positioned, and must scroll with the table, not widen the page. */}
      <div className="relative overflow-x-auto">
        {/* On a wide screen the table is only as wide as it needs, so the numbers stay near the names.
            The roles keep it a table for screen readers where it is not drawn as one. */}
        <table role="table" className="block w-full border-collapse text-sm sm:table sm:w-auto">
          <caption className="sr-only">{t.statistics.positionTableCaption}</caption>
          <thead role="rowgroup" className="block sm:table-header-group">
            <tr role="row" style={columns} className="grid border-b border-border text-xs uppercase text-muted sm:table-row">
              <th role="columnheader" scope="col" className="w-6 py-2 text-left">#</th>
              <th role="columnheader" scope="col" className={`py-2 text-left ${stacked ? 'max-sm:sr-only' : ''}`}>{t.common.player}</th>
              {positions.map((position) => (
                <th key={position} role="columnheader" scope="col" className="py-2 text-center font-display text-sm font-extrabold text-text sm:w-14 sm:px-1">{ordinal(position)}</th>
              ))}
            </tr>
          </thead>
          <tbody role="rowgroup" className="block sm:table-row-group">
            {shown.map((row, i) => (
              <tr key={row.player.id} role="row" style={columns} className="grid border-b border-border/60 last:border-0 even:bg-surface-stripe sm:table-row">
                {/* The line after the last one shown counts too: it may be tied with it. */}
                <RankCell compact role="cell" rank={row.rank} tied={rows[i - 1]?.rank === row.rank || rows[i + 1]?.rank === row.rank} />
                {/* A long name is cut short instead of widening the table. */}
                <td role="cell" className={`min-w-0 py-1 sm:w-56 sm:max-w-56 sm:pr-4 ${stacked ? 'col-[2/-1]' : ''}`}>
                  <span className="flex items-center gap-2">
                    <PlayerThumbnail player={row.player} size="xs" />
                    <PlayerLink player={row.player} className="min-w-0 truncate font-semibold" />
                  </span>
                </td>
                {row.positions.map((p, column) => (
                  <td key={p.position} role="cell" className={`text-center tabular sm:px-1 sm:py-1 ${stacked ? 'pb-1.5' : 'self-center'} ${stacked && column === 0 ? 'col-start-2' : ''}`}>
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
