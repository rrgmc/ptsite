import type { Player } from '@/api/client'

export const medals = ['🥇', '🥈', '🥉']

export interface PodiumLine {
  /** The place, shared by tied players: 1, 1, 3. */
  rank: number
  player: Player
}

/** The lines of the first three places. Players who share a place are all kept, so there can be more than three. */
export function podiumLines<T extends PodiumLine>(lines: T[]): T[] {
  return lines.filter((line) => line.rank <= medals.length)
}
