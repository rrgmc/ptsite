import { useNavigate } from 'react-router'
import type { Season } from '@/api/client'
import { isSeasonScreen, seasonPath, splitSeasonPath } from '@/lib/seasonPath'
import { useSelectedSeason } from '../layout/useSelectedSeason'

/**
 * Opens a season: the screen of `from` when it is a season screen, or the standings, at that season's address.
 * Also tells which season is selected now and which is the current one.
 */
export function usePickSeason(from?: string) {
  const { season: selected, defaultSeason } = useSelectedSeason()
  const navigate = useNavigate()

  function pick(season: Season) {
    // The current season has the address with no season in it, so the site follows the next season when it opens.
    const seasonId = season.id === defaultSeason?.id ? null : season.id
    void navigate(seasonPath(seasonId, isSeasonScreen(from) ? splitSeasonPath(from).screen : '/'))
  }

  return { pick, selected, defaultSeason }
}
