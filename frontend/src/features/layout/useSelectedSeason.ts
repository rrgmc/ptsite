import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { ApiError } from '@/api/client'
import { useCurrentSeason, useSeason, useSeasons } from '@/api/queries'
import { isSeasonScreen, seasonPath, splitSeasonPath, useViewedSeasonId } from '@/lib/seasonPath'
import { setSelectedSeasonId } from '@/lib/selectedSeason'

/**
 * The season on screen. A season screen shows the season in its address (/seasons/7/results), or the current
 * season when the address names none (/results). Any other screen has the last season this browser tab showed.
 * `seasonId` is that season's id, or null for the current one. `isCurrent` is false only when a season other
 * than the default one is on screen.
 */
export function useSelectedSeason() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const seasonId = useViewedSeasonId()
  const current = useCurrentSeason()
  const seasons = useSeasons()
  const picked = useSeason(seasonId ?? 0)

  // No open season: fall back to the newest one.
  const defaultSeason = current.data ?? (current.data === null ? seasons.data?.[0] : undefined)
  const defaultPending = current.isPending || (current.data === null && seasons.isPending)

  // A season that does not exist, or was removed or archived since: go back to the current one.
  const gone = seasonId === 0 || (picked.error instanceof ApiError && picked.error.status === 404) || picked.data?.archived === true
  useEffect(() => {
    if (seasonId === null || !gone) return
    if (isSeasonScreen(pathname)) void navigate(splitSeasonPath(pathname).screen, { replace: true })
    else setSelectedSeasonId(null)
  }, [seasonId, gone, pathname, navigate])

  if (seasonId === null || gone) {
    return { season: defaultSeason, defaultSeason, seasonId: null, isPending: defaultPending, error: current.error, isCurrent: true }
  }
  return {
    season: picked.data,
    defaultSeason,
    seasonId,
    isPending: picked.isPending,
    error: picked.error,
    isCurrent: !picked.data || !defaultSeason || picked.data.id === defaultSeason.id,
  }
}

/**
 * The address of a season screen for one given season, for a link that leaves a night or the admin section:
 * `to(night.season_id, '/results')`. The current season gets the address with no season in it.
 */
export function usePathOfSeason(): (seasonId: number, screen: string) => string {
  const { defaultSeason } = useSelectedSeason()
  return (seasonId, screen) => seasonPath(seasonId === defaultSeason?.id ? null : seasonId, screen)
}
