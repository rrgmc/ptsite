import { useEffect } from 'react'
import { ApiError } from '@/api/client'
import { useCurrentSeason, useSeason, useSeasons } from '@/api/queries'
import { setSelectedSeasonId, useSelectedSeasonId } from '@/lib/selectedSeason'

/**
 * The season every screen shows: the one picked in "Temporadas", or the current season when there is no pick.
 * `isCurrent` is false only when a picked season other than the default one is on screen.
 */
export function useSelectedSeason() {
  const pickedId = useSelectedSeasonId()
  const current = useCurrentSeason()
  const seasons = useSeasons()
  const picked = useSeason(pickedId ?? 0)

  // No open season: fall back to the newest one.
  const defaultSeason = current.data ?? (current.data === null ? seasons.data?.[0] : undefined)
  const defaultPending = current.isPending || (current.data === null && seasons.isPending)

  // A picked season that was removed or archived since: go back to the current one.
  const gone = (picked.error instanceof ApiError && picked.error.status === 404) || picked.data?.archived === true
  useEffect(() => {
    if (pickedId !== null && gone) setSelectedSeasonId(null)
  }, [pickedId, gone])

  if (pickedId === null || gone) {
    return { season: defaultSeason, defaultSeason, isPending: defaultPending, error: current.error, isCurrent: true }
  }
  return {
    season: picked.data,
    defaultSeason,
    isPending: picked.isPending,
    error: picked.error,
    isCurrent: !picked.data || !defaultSeason || picked.data.id === defaultSeason.id,
  }
}
