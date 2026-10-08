import type { Night } from '@/api/client'

/**
 * The finished nights of a season, oldest first, each with its number as a round. An extra night and the Main
 * Event night are not rounds: they have no number and do not move the count.
 */
export function numberRounds<N extends Pick<Night, 'status' | 'is_extra'>>(nights: N[]): { night: N; number?: number }[] {
  let round = 0
  return nights.filter((n) => n.status === 'finished').map((night) => ({ night, number: night.is_extra ? undefined : ++round }))
}
