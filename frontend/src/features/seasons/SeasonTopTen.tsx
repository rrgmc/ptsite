import type { Standing } from '@/api/client'
import { PlayerLink } from '@/components/PlayerLink'
import { PlayerThumbnail } from '@/components/PlayerThumbnail'
import { rankColor } from '@/components/rankColor'
import { t } from '@/i18n'
import { formatPoints } from '@/lib/format'

/**
 * The first ten of a season's standings, as one short list. From a tablet up it takes two columns, read down the
 * first and then down the second: 1 to 5, then 6 to 10. Under it, how many tied players did not fit.
 */
export function SeasonTopTen({ caption, rows, tiedNotShown = 0 }: {
  /** For screen readers: what the list is. */
  caption: string
  rows: Standing[]
  tiedNotShown?: number
}) {
  return (
    <>
      <ol aria-label={caption} className="gap-x-8 sm:columns-2">
        {rows.map((row, i) => {
          const tied = rows[i - 1]?.rank === row.rank || rows[i + 1]?.rank === row.rank || (i === rows.length - 1 && tiedNotShown > 0)
          return (
            <li key={row.player.id} className="flex break-inside-avoid items-center gap-2 border-b border-border/60 py-1">
              <span className={`w-7 shrink-0 text-center font-display text-lg font-extrabold tabular ${rankColor(row.rank)}`}>
                {row.rank}
                {tied && <span className="sr-only"> {t.components.rankedList.tied}</span>}
              </span>
              <PlayerThumbnail player={row.player} size="xs" />
              <PlayerLink player={row.player} className="min-w-0 flex-1 font-semibold" />
              <span className="shrink-0 font-bold tabular">{formatPoints(row.points)}</span>
            </li>
          )
        })}
      </ol>
      {tiedNotShown > 0 && (
        <p className="mt-2 text-sm text-muted">{t.components.rankedList.moreTied({ count: tiedNotShown })}</p>
      )}
    </>
  )
}
