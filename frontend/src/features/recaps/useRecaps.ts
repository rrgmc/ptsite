import type { Night, SeasonRecap } from '@/api/client'
import { usePlayers, useSeasonNights, useSeasonRecaps } from '@/api/queries'
import { hasFeature } from '@/lib/features'
import { numberRounds } from '../results/rounds'
import { splitRecap } from './recapText'

/** One recap as the screens show it: its title and text apart, and its night with the night's round number. */
export type RecapView = { recap: SeasonRecap; title: string; text: string; night?: Night; number?: number }

/**
 * A season's recaps, newest first, with what the screens show beside them, and the nicknames to put in bold.
 * Nothing on a site without recaps.
 */
export function useRecaps(seasonId: number | undefined) {
  const enabled = hasFeature('seasonRecaps') ? seasonId : undefined
  const recaps = useSeasonRecaps(enabled)
  const nights = useSeasonNights(enabled)
  const players = usePlayers()
  const numbered = new Map(numberRounds(nights.data ?? []).map(({ night, number }) => [night.id, { night, number }]))

  const views: RecapView[] = (recaps.data ?? []).map((recap) => ({
    recap,
    ...splitRecap(recap.body),
    ...(recap.night ? numbered.get(recap.night.id) : {}),
  }))

  return {
    views,
    nicknames: (players.data ?? []).map((p) => p.nickname),
    isPending: enabled !== undefined && recaps.isPending,
    error: recaps.error,
  }
}

/** The id of a recap's place on the page of recaps, for links that go straight to it. */
export const recapAnchor = (recap: SeasonRecap) => `recap-${recap.id}`
