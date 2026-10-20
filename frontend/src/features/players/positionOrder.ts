import type { Statistics } from '@/api/client'

/**
 * The players in the order of "Posições" (docs/specs/statistics.md, rule 3c): the players in the table first, in
 * its order, then the players who are not in it, in the order they came in.
 */
export function byPositionTable<P extends { id: number }>(players: P[], table: Statistics['position_table']): P[] {
  const place = new Map(table.map((row, i) => [row.player.id, i]))
  // The sort is stable, so the players who are not in the table keep their order.
  const at = (p: P) => place.get(p.id) ?? table.length
  return players.toSorted((a, b) => at(a) - at(b))
}
