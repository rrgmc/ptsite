import type { ReactNode } from 'react'

const medal = ['text-gold', 'text-silver', 'text-bronze']

/** The position in a ranked table, with medal colors for the first three. Tied lines say so to screen readers. */
export function RankCell({ rank, tied }: { rank: number; tied: boolean }) {
  return (
    <td className={`py-3 px-1 sm:px-2 font-display text-lg font-extrabold tabular ${medal[rank - 1] ?? 'text-muted'}`}>
      {rank}
      {tied && <span className="sr-only"> (empatado)</span>}
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

/** A short ranked table: position, who or what, and a value. Under it, how many tied lines did not fit. */
export function RankedList({ caption, labelHeader, valueHeader, rows, tiedNotShown = 0 }: {
  /** For screen readers: what the table lists. */
  caption: string
  labelHeader: string
  valueHeader: string
  rows: RankedRow[]
  tiedNotShown?: number
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase text-muted">
            <th scope="col" className="w-8 px-1 py-2 sm:w-12 sm:px-2">#</th>
            <th scope="col" className="py-2">{labelHeader}</th>
            <th scope="col" className="py-2 pr-2 text-right">{valueHeader}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.key} className="border-b border-border/60 last:border-0 even:bg-surface-stripe">
              <RankCell rank={row.rank} tied={rows[i - 1]?.rank === row.rank || rows[i + 1]?.rank === row.rank || (i === rows.length - 1 && tiedNotShown > 0)} />
              <td className="py-2">{row.label}</td>
              <td className="py-3 pr-2 text-right font-bold tabular">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {tiedNotShown > 0 && (
        <p className="mt-2 text-sm text-muted">e mais {tiedNotShown} {tiedNotShown === 1 ? 'empatado' : 'empatados'}</p>
      )}
    </div>
  )
}
