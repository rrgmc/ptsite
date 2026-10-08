import { Link } from 'react-router'
import type { Night } from '@/api/client'
import { PlayerThumbnail } from '@/components/PlayerThumbnail'
import { PlayerLink } from '@/components/PlayerLink'
import { formatMoney, formatPoints, nightTitle, ordinal } from '@/lib/format'
import { amountRows } from '../nights/amounts'
import { NightMark } from '../nights/NightMark'

/**
 * A finished night: who finished in each scoring position, then the night's amounts.
 * `number` is the night's place in its season, counting from 1. An extra night has no number, and is marked.
 */
export function NightResultCard({ night, number }: { night: Night; number?: number }) {
  const amounts = amountRows({ pot: night.pot, mainEventPot: night.main_event_pot, timeChip: night.time_chip })

  return (
    // On a phone the rows are shorter and the card has less padding, so that a night takes less of the screen.
    <article className="rounded-lg bg-surface p-2 shadow-card sm:p-4">
      <header className="mb-2 px-1 sm:px-0">
        <h3 className="flex flex-wrap items-center gap-2 font-display font-bold">
          <Link to={`/nights/${night.id}`} className="hover:underline">{nightTitle(night.starts_at, number)}</Link>
          <NightMark night={night} />
        </h3>
      </header>
      <ol className="divide-y divide-border/60">
        {night.results?.map((line) => (
          <li key={line.position} className="flex items-center justify-between px-1 py-1 even:bg-surface-stripe sm:px-2 sm:py-1.5">
            <span className="flex min-w-0 items-center gap-2">
              <span className="w-7 shrink-0 font-bold text-muted tabular sm:w-8">{ordinal(line.position)}</span>
              <PlayerThumbnail player={line.player} size="sm" />
              <PlayerLink player={line.player} className="min-w-0" />
            </span>
            <span className="shrink-0 pl-2 tabular">{formatPoints(line.points)}</span>
          </li>
        ))}
      </ol>
      <dl className="mt-2 border-t border-border px-1 pt-2 text-sm sm:px-0">
        {amounts.map(([label, amount]) => (
          <div key={label} className="flex items-center justify-between py-0.5">
            <dt className="font-semibold">{label}</dt>
            <dd className="tabular">{formatMoney(amount)}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}
