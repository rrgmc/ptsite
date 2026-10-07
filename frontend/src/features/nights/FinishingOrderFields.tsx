import type { Player } from '@/api/client'
import { PlayerPicker } from '@/components/PlayerPicker'
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
        <li key={p.position} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
          <PlayerPicker
            label={`${ordinal(p.position)} lugar · ${p.percent}%`}
            players={players}
            value={order[i] ?? null}
            onChange={(player) => onChange(order.map((x, j) => (j === i ? player : x)))}
            excludeIds={chosenIds.filter((id) => id !== order[i]?.id)}
            allowQuickAdd={allowQuickAdd}
            clearable={clearable}
            errorMessage={fieldError?.(`positions.${p.position}`)}
            firstGroup={firstGroup}
          />
          <output className="min-h-touch min-w-20 content-center text-right font-bold tabular" aria-label={`Pontos do ${ordinal(p.position)} lugar`}>
            {pot ? formatPoints(shareOf(pot, p.percent)) : '—'}
          </output>
        </li>
      ))}
    </ol>
  )
}
