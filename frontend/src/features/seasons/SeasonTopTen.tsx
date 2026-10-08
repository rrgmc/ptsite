import type { Standing } from '@/api/client'
import { PlayerLink } from '@/components/PlayerLink'
import { PlayerThumbnail } from '@/components/PlayerThumbnail'
import { rankColor } from '@/components/rankColor'
import { t } from '@/i18n'
import { formatPoints } from '@/lib/format'

/**
 * The first ten of a season's standings, as one short list, 1 to 10 from top to bottom. Under it, how many tied
 * players did not fit.
 */
export function SeasonTopTen({ caption, rows, tiedNotShown = 0 }: {
  /** For screen readers: what the list is. */
  caption: string
  rows: Standing[]
  tiedNotShown?: number
}) {
  return (
    <>
      <ol aria-label={caption}>
        {rows.map((row, i) => {
          const tied = rows[i - 1]?.rank === row.rank || rows[i + 1]?.rank === row.rank || (i === rows.length - 1 && tiedNotShown > 0)
          return (
            // With large text on a phone the nickname and the points do not fit beside the photo: they move down.
            <li key={row.player.id} className="flex flex-wrap items-center gap-x-2 border-b border-border/60 px-2 py-1 last:border-0 even:bg-surface-stripe">
              <span className={`w-7 shrink-0 text-center font-display text-lg font-extrabold tabular ${rankColor(row.rank)}`}>
                {row.rank}
                {tied && <span className="sr-only"> {t.components.rankedList.tied}</span>}
              </span>
              <PlayerThumbnail player={row.player} size="xs" />
              <PlayerLink player={row.player} className="min-w-20 flex-1 font-semibold" />
              <span className="ml-auto shrink-0 font-bold tabular">{formatPoints(row.points)}</span>
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
