import { useState } from 'react'
import type { Statistics } from '@/api/client'
import { Button } from '@/components/Button'
import { PlayerLink } from '@/components/PlayerLink'
import { PlayerThumbnail } from '@/components/PlayerThumbnail'
import { RankCell } from '@/components/RankedList'
import { t } from '@/i18n'
import { ordinal } from '@/lib/format'

/** How many lines show before "Ver todos". */
const FIRST = 10

/**
 * "Posições" as a medal table: a line per player and a column per scoring position, with the times the player
 * finished there. The API orders it: most 1st places first, then most 2nd places, and so on.
 * It shows the first ten lines, and the rest on request.
 */
export function PositionTable({ rows }: { rows: Statistics['position_table'] }) {
  const [all, setAll] = useState(false)
  const positions = rows[0]?.positions.map((p) => p.position) ?? []
  const shown = all ? rows : rows.slice(0, FIRST)

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{t.statistics.positionTableCaption}</caption>
          <thead>
            <tr className="border-b border-border text-xs uppercase text-muted">
              <th scope="col" className="w-6 py-2 text-left">#</th>
              <th scope="col" className="py-2 text-left">{t.common.player}</th>
              {positions.map((position) => (
                <th key={position} scope="col" className="px-1.5 py-2 text-right font-display text-sm font-extrabold text-text sm:px-4">{ordinal(position)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, i) => (
              <tr key={row.player.id} className="border-b border-border/60 last:border-0 even:bg-surface-stripe">
                {/* The line after the last one shown counts too: it may be tied with it. */}
                <RankCell compact rank={row.rank} tied={rows[i - 1]?.rank === row.rank || rows[i + 1]?.rank === row.rank} />
                {/* max-w-0: a long name is cut short instead of widening the table. */}
                <td className="w-full max-w-0 py-1">
                  <span className="flex items-center gap-2">
                    <PlayerThumbnail player={row.player} size="xs" />
                    <PlayerLink player={row.player} className="min-w-0 truncate font-semibold" />
                  </span>
                </td>
                {row.positions.map((p) => (
                  <td key={p.position} className={`px-1.5 py-1 text-right tabular sm:px-4 ${p.count === 0 ? 'text-muted' : 'font-bold'}`}>{p.count}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > FIRST && (
        <Button variant="ghost" className="mt-2" aria-expanded={all} onPress={() => setAll(!all)}>
          {all ? t.statistics.showFirst({ count: FIRST }) : t.statistics.showAll({ count: rows.length })}
        </Button>
      )}
    </>
  )
}
