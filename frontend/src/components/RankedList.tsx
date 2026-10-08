import type { ReactNode } from 'react'
import { t } from '@/i18n'
import { rankColor } from './rankColor'


/** The position in a ranked table, with medal colors for the first three. Tied lines say so to screen readers. */
export function RankCell({ rank, tied, compact = false }: { rank: number; tied: boolean; compact?: boolean }) {
  return (
    <td className={`font-display font-extrabold tabular ${compact ? 'w-6 py-1 pr-1 text-sm' : 'py-3 px-1 sm:px-2 text-lg'} ${rankColor(rank)}`}>
      {rank}
      {tied && <span className="sr-only"> {t.components.rankedList.tied}</span>}
    </td>
  )
}

export interface RankedRow {
  key: string | number
  /** Lines with the same value share a rank (1, 2, 2, 4). */
  rank: number
  label: ReactNode
  value: ReactNode
}

/**
 * A short ranked table: position, who or what, and a value. Under it, how many tied lines did not fit.
 * A compact one has short lines, small text and no header line, for a list that stands beside others under a
 * title that already says what it lists. Its header is still there for screen readers.
 */
export function RankedList({ caption, labelHeader, valueHeader, rows, tiedNotShown = 0, compact = false }: {
  /** For screen readers: what the table lists. */
  caption: string
  labelHeader: string
  valueHeader: string
  rows: RankedRow[]
  tiedNotShown?: number
  compact?: boolean
}) {
  return (
    <div className="overflow-x-auto">
      <table className={`w-full border-collapse ${compact ? 'text-sm' : ''}`}>
        <caption className="sr-only">{caption}</caption>
        <thead className={compact ? 'sr-only' : undefined}>
          <tr className="border-b border-border text-left text-xs uppercase text-muted">
            <th scope="col" className={compact ? 'w-6' : 'w-8 px-1 py-2 sm:w-12 sm:px-2'}>#</th>
            <th scope="col" className="py-2">{labelHeader}</th>
            <th scope="col" className="py-2 pr-2 text-right">{valueHeader}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.key} className="border-b border-border/60 last:border-0 even:bg-surface-stripe">
              <RankCell compact={compact} rank={row.rank} tied={rows[i - 1]?.rank === row.rank || rows[i + 1]?.rank === row.rank || (i === rows.length - 1 && tiedNotShown > 0)} />
              {/* max-w-0: a compact line cuts a long name short instead of widening the table. */}
              <td className={compact ? 'w-full max-w-0 py-1' : 'py-2'}>{row.label}</td>
              <td className={`text-right font-bold tabular ${compact ? 'py-1 pl-2 pr-1 whitespace-nowrap' : 'py-3 pr-2'}`}>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {tiedNotShown > 0 && (
        <p className={`text-muted ${compact ? 'mt-1 text-xs' : 'mt-2 text-sm'}`}>{t.components.rankedList.moreTied({ count: tiedNotShown })}</p>
      )}
    </div>
  )
}
