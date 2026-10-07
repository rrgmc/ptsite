import { useNavigate } from 'react-router'
import type { Season } from '@/api/client'
import { setSelectedSeasonId } from '@/lib/selectedSeason'
import { isSeasonScreen } from '../layout/navigation'
import { useSelectedSeason } from '../layout/useSelectedSeason'

/**
 * Makes a season the one that every screen shows, then opens `from` when it is a season screen, or the standings.
 * Also tells which season is selected now and which is the current one.
 */
export function usePickSeason(from?: string) {
  const { season: selected, defaultSeason } = useSelectedSeason()
  const navigate = useNavigate()

  function pick(season: Season) {
    // The current season is "no pick", so the site follows the next season when it opens.
    setSelectedSeasonId(season.id === defaultSeason?.id ? null : season.id)
    navigate(isSeasonScreen(from) ? from : '/')
  }

  return { pick, selected, defaultSeason }
}
