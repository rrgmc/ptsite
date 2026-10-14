import type { Player } from '@/api/client'
import { PlayerPicker } from '@/components/PlayerPicker'
import { t } from '@/i18n'
import { formatPoints, ordinal, shareOf } from '@/lib/format'

/**
 * One player picker per scoring position, with the points that position earns from the pot typed so far.
 * Shared by the results form and the partial result form; `order` follows the percentage table.
 */
export function FinishingOrderFields({
  percentages,
  players,
  order,
  onChange,
  pot,
  fieldError,
  firstGroup,
  allowQuickAdd,
  clearable,
}: {
  percentages: { position: number; percent: number }[]
  players: Player[]
  order: (Player | null)[]
  onChange: (order: (Player | null)[]) => void
  /** The pot as an API decimal string, or null while it is empty or invalid. */
  pot: string | null
  fieldError?: (field: string) => string | undefined
  firstGroup?: { label: string; ids: number[] }
  allowQuickAdd?: boolean
  clearable?: boolean
}) {
  const chosenIds = order.filter((p): p is Player => p !== null).map((p) => p.id)

  return (
    <ol className="flex flex-col gap-3">
      {percentages.map((p, i) => (
        <li key={p.position} className="flex flex-wrap items-end gap-x-3 gap-y-1">
          <div className="min-w-40 flex-1">
            <PlayerPicker
              label={t.nights.finishingOrder.positionLabel({ position: ordinal(p.position), percent: p.percent })}
              players={players}
              value={order[i] ?? null}
              onChange={(player) => onChange(order.map((x, j) => (j === i ? player : x)))}
              excludeIds={chosenIds.filter((id) => id !== order[i]?.id)}
              allowQuickAdd={allowQuickAdd}
              clearable={clearable}
              errorMessage={fieldError?.(`positions.${p.position}`)}
              firstGroup={firstGroup}
            />
          </div>
          <output className="ml-auto min-h-touch min-w-20 content-center text-right font-bold tabular" aria-label={t.nights.finishingOrder.positionPoints({ position: ordinal(p.position) })}>
            {pot ? formatPoints(shareOf(pot, p.percent)) : '—'}
          </output>
        </li>
      ))}
    </ol>
  )
}
