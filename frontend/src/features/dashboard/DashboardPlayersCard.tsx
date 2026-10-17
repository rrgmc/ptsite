import type { NightDashboard } from '@/api/client'
import { Card } from '@/components/Card'
import { ChipSign, StatusChip } from '@/components/ToggleChip'
import { t } from '@/i18n'
import type { DashboardPlayer } from './dashboardMoney'
import { PlayerBalance, PlayerName } from './PlayerMoneyLine'

const labels = t.dashboard.players

/** What a screen reader says for a buy-in or a rebuy: whether it was paid, and how. */
function paymentState(paid: boolean, nonCash: boolean): string {
  return paid ? (nonCash ? labels.paidNonCash : labels.paidCash) : labels.unpaid
}

/**
 * The players of a finished night's dashboard, on the night's page, where nothing is changed: what each one paid,
 * in cash or not, their rebuys and their time chip.
 */
export function DashboardPlayersCard({ dashboard }: { dashboard: NightDashboard }) {
  const hasTimeChip = dashboard.totals.time_chip !== null

  return (
    <Card title={labels.heading({ count: dashboard.players.length })}>
      <ul className="-mx-2 divide-y divide-border/60">
        {dashboard.players.map((line) => (
          <PlayerStatusRow key={line.player.id} line={line} hasTimeChip={hasTimeChip} />
        ))}
      </ul>
      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1"><ChipSign tone="done" swatch /> {t.dashboard.legend.cash}</span>
        <span className="inline-flex items-center gap-1"><ChipSign tone="otherWay" swatch /> {t.dashboard.legend.nonCash}</span>
      </p>
    </Card>
  )
}

function PlayerStatusRow({ line, hasTimeChip }: { line: DashboardPlayer; hasTimeChip: boolean }) {
  return (
    // One line when it fits: the name, the marks as small tags, then what is pending at the end.
    <li className="flex flex-wrap items-center gap-x-2 gap-y-1 px-2 py-1 even:bg-surface-stripe">
      <PlayerName line={line} />
      <div role="group" aria-label={labels.marksOf({ nickname: line.player.nickname })} className="flex flex-wrap items-center gap-1">
        <StatusChip
          tone={line.buy_in_non_cash ? 'otherWay' : 'done'}
          isSelected={line.buy_in_paid}
          label={labels.chipState({ payment: labels.buyIn, state: paymentState(line.buy_in_paid, line.buy_in_non_cash) })}
        >
          {labels.buyIn}
        </StatusChip>
        {hasTimeChip && line.time_chip && (
          <>
            <StatusChip tone="owed" isSelected label={labels.chipState({ payment: labels.timeChip, state: labels.lateArrival })}>
              {labels.timeChip}
            </StatusChip>
            <StatusChip isSelected={line.time_chip_paid} label={labels.chipState({ payment: labels.timeChip, state: line.time_chip_paid ? labels.paid : labels.unpaid })}>
              {labels.timeChipPaid}
            </StatusChip>
          </>
        )}
        {line.rebuys.map((rebuy, index) => (
          <StatusChip
            key={index}
            tone={rebuy.non_cash ? 'otherWay' : 'done'}
            isSelected={rebuy.paid}
            label={labels.chipState({ payment: labels.rebuy({ number: index + 1 }), state: paymentState(rebuy.paid, rebuy.non_cash) })}
          >
            {labels.rebuy({ number: index + 1 })}
          </StatusChip>
        ))}
      </div>
      <PlayerBalance line={line} showSettled={false} className="ml-auto" />
    </li>
  )
}
