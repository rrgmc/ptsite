import { Badge } from '@/components/Feedback'
import { PlayerThumbnail } from '@/components/PlayerThumbnail'
import { t } from '@/i18n'
import { formatMoney } from '@/lib/format'
import type { DashboardPlayer } from './dashboardMoney'

/** The top line of a participant's row: who they are, then what is pending and what they paid not in cash. */
export function PlayerMoneyLine({ line }: { line: DashboardPlayer }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
      <PlayerName line={line} />
      <PlayerBalance line={line} />
    </div>
  )
}

/** Who the participant is: their picture, their nickname and whether they are the house owner. */
export function PlayerName({ line }: { line: DashboardPlayer }) {
  const { player } = line

  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
      <PlayerThumbnail player={player} size="xs" />
      <span className="min-w-0 truncate font-semibold">{player.nickname}</span>
      {line.is_house_owner && <Badge tone="info">{t.dashboard.players.houseOwner}</Badge>}
    </span>
  )
}

/**
 * What the participant has pending, or that they paid it all, and what they paid not in cash. Without `showSettled`,
 * a participant with everything paid shows no text for it.
 */
export function PlayerBalance({ line, showSettled = true, className = '' }: { line: DashboardPlayer; showSettled?: boolean; className?: string }) {
  return (
    <span className={`shrink-0 text-sm tabular ${className}`}>
      {Number(line.pending) > 0 ? (
        <span className="font-semibold text-warning">{t.dashboard.players.pending({ amount: formatMoney(line.pending) })}</span>
      ) : (
        showSettled && Number(line.owed) > 0 && <span className="text-muted">{t.dashboard.players.settled}</span>
      )}
      {Number(line.non_cash) > 0 && (
        // With the sign of a payment that was not in cash; a screen reader gets it in words.
        <span className="text-muted">
          {' '}
          <span aria-hidden>{t.dashboard.players.nonCashAmount({ amount: formatMoney(line.non_cash) })}</span>
          <span className="sr-only">{t.dashboard.players.nonCashAmountSpoken({ amount: formatMoney(line.non_cash) })}</span>
        </span>
      )}
    </span>
  )
}
