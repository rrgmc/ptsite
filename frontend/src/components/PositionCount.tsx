import { t } from '@/i18n'

/**
 * How often a player finished in one scoring position, in a table with a column per position.
 * The highest number of the column is marked by its box and its weight, and said to screen readers: not by color
 * alone. A position the player never reached shows a dash.
 */
export function PositionCount({ count, highest }: { count: number; highest: number }) {
  if (count === 0) {
    return <span className="text-muted"><span aria-hidden="true">{t.statistics.never}</span><span className="sr-only">0</span></span>
  }
  if (count === highest) {
    return (
      <span className="inline-block min-w-6 rounded-md bg-primary px-1 sm:min-w-7 sm:px-1.5 font-extrabold text-on-primary">
        {count}<span className="sr-only"> {t.statistics.highestOfPosition}</span>
      </span>
    )
  }
  return <span className="font-medium">{count}</span>
}

/** The highest number of each position's column, among the given lines. */
export function highestCounts(rows: { positions: { count: number }[] }[]): number[] {
  return (rows[0]?.positions ?? []).map((_, column) => Math.max(...rows.map((row) => row.positions[column].count)))
}
