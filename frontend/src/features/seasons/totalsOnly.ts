import type { Season } from '@/api/client'

/** The nights a season had: its finished rounds, or its rounds when it is known only by its final standings. */
export function playedRounds(season: Season): number {
  return season.totals_only ? season.rounds : (season.nights_count ?? 0)
}
