import type { Player } from '@/api/client'
import { Button } from '@/components/Button'
import { PlayerPicker } from '@/components/PlayerPicker'
import { t } from '@/i18n'
import { ordinal } from '@/lib/format'
import { type Order, withEmptyRow } from './order'

/**
 * The finishing order of a Main Event: one player picker per position, the 1st place first, as many as are
 * known. After the last player there is always one empty picker, for the next position. Removing a player moves
 * the ones below up, so no position is skipped.
 */
export function PlayerOrderFields({
  players,
  order,
  onChange,
  fieldError,
  firstGroup,
  allowQuickAdd,
}: {
  players: Player[]
  /** As withEmptyRow gives it. */
  order: Order
  onChange: (order: Order) => void
  fieldError?: (field: string) => string | undefined
  firstGroup?: { label: string; ids: number[] }
  allowQuickAdd?: boolean
}) {
  const chosenIds = order.filter((p) => p !== null).map((p) => p.id)

  return (
    <ol className="flex flex-col gap-3">
      {order.map((player, i) => (
        // The row is its position: a removed player's row is taken by the next one.
        <li key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
          <PlayerPicker
            label={t.mainEvent.resultForm.positionLabel({ position: ordinal(i + 1) })}
            players={players}
            value={player}
            onChange={(picked) => onChange(withEmptyRow(order.map((x, j) => (j === i ? picked : x))))}
            excludeIds={chosenIds.filter((id) => id !== player?.id)}
            allowQuickAdd={allowQuickAdd}
            errorMessage={fieldError?.(`player_ids.${i}`)}
            firstGroup={firstGroup}
          />
          {player && (
            <Button
              variant="ghost"
              aria-label={t.mainEvent.resultForm.removePosition({ position: ordinal(i + 1) })}
              onPress={() => onChange(withEmptyRow(order.filter((_, j) => j !== i)))}
            >
              {t.common.remove}
            </Button>
          )}
        </li>
      ))}
    </ol>
  )
}
