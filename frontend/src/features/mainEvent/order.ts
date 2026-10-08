import type { Player } from '@/api/client'

/** The rows of the Main Event form: one per position, the 1st place first. A row with no player is null. */
export type Order = (Player | null)[]

/**
 * The rows to show: the players chosen, with no empty row among them, then one empty row for the next position.
 * So the list grows as it is filled, and a removed player's row closes.
 */
export function withEmptyRow(order: Order): Order {
  return [...order.filter((player) => player !== null), null]
}

/** The player ids to send, the 1st place first; null while nobody is chosen. */
export function playerIdsOf(order: Order): number[] | null {
  const ids = order.filter((player) => player !== null).map((player) => player.id)
  return ids.length > 0 ? ids : null
}
