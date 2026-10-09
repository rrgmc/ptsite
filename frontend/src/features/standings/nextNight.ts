import type { Night, Season } from '@/api/client'

/**
 * The night that "Classificação" shows as open or next: the season's open night, or else its first scheduled
 * one. A finished season has none, even with a night that was never finished.
 */
export function nextNight<N extends Pick<Night, 'status'>>(season: Pick<Season, 'is_finished'>, nights: N[]): N | undefined {
  if (season.is_finished) return undefined
  return nights.find((n) => n.status === 'open') ?? nights.find((n) => n.status === 'scheduled')
}
