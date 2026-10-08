import { useLocation } from 'react-router'
import { useSelectedSeasonId } from './selectedSeason'

/**
 * A season's own addresses (docs/specs/seasons-and-nights.md). A season screen stands at the root for the current
 * season (/results) and under the season's id for any season (/seasons/7/results). Both show the same screen.
 */

const prefixed = /^\/seasons\/(\d+)(\/.*)?$/

/** Splits /seasons/7/results into season 7 and the screen /results. A path with no season has `seasonId` null. */
export function splitSeasonPath(pathname: string): { seasonId: number | null; screen: string } {
  const match = prefixed.exec(pathname)
  if (!match) return { seasonId: null, screen: pathname }
  return { seasonId: Number(match[1]), screen: match[2]?.replace(/\/$/, '') || '/' }
}

/** The address of a season screen for one season. No season (null) means the current one. */
export function seasonPath(seasonId: number | null, screen: string): string {
  if (seasonId === null) return screen
  return `/seasons/${seasonId}${screen === '/' ? '' : screen}`
}

/** The screens that show one season. A player's page does too: /players/12, but not /players/12/all. */
const seasonScreens = ['/', '/results', '/calendar', '/simulator', '/statistics', '/main-event']
const playerPage = /^\/players\/\d+$/

/** Whether a path, with or without a season in it, is a season screen. */
export function isSeasonScreen(path: string | undefined): path is string {
  if (path === undefined) return false
  const { screen } = splitSeasonPath(path)
  return seasonScreens.includes(screen) || playerPage.test(screen)
}

/**
 * The id of the season to name in addresses, or null for the current season. On a season screen it is the one in
 * the address. Any other screen has no season of its own, so it is the last season this browser tab showed.
 */
export function useViewedSeasonId(): number | null {
  const { pathname } = useLocation()
  const remembered = useSelectedSeasonId()
  return isSeasonScreen(pathname) ? splitSeasonPath(pathname).seasonId : remembered
}

/** Makes links keep the season on screen: `to('/results')` is /seasons/7/results while season 7 is viewed. */
export function useSeasonPath(): (screen: string) => string {
  const seasonId = useViewedSeasonId()
  return (screen) => (isSeasonScreen(screen) ? seasonPath(seasonId, screen) : screen)
}
