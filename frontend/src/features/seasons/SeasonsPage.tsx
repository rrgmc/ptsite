import type { ReactNode } from 'react'
import type { SeasonTopStandings } from '@/api/client'
import { useSeasonsTopStandings } from '@/api/queries'
import { Button } from '@/components/Button'
import { Card, PageHeader } from '@/components/Card'
import { Empty, ErrorBox, Loading } from '@/components/Feedback'
import { PlayerLink } from '@/components/PlayerLink'
import { PlayerThumbnail } from '@/components/PlayerThumbnail'
import { t } from '@/i18n'
import { hasFeature } from '@/lib/features'
import { formatDate } from '@/lib/format'
import { SeasonBadge } from './SeasonBadge'
import { playedRounds } from './totalsOnly'
import { SeasonTopTen } from './SeasonTopTen'
import { usePickSeason } from './usePickSeason'

/**
 * "Temporadas", from the menu: every season, newest first, each with the first ten of its standings and, on a
 * site that has the Main Event, its Main Event champion. From a tablet up, two seasons stand side by side. A
 * season can be made the one that every screen shows. A list at the top names each season and its winner, and
 * scrolls to the season's card.
 */
export function SeasonsPage() {
  const seasons = useSeasonsTopStandings()
  const { pick, selected, defaultSeason } = usePickSeason()

  if (seasons.isPending) return <Loading />
  if (seasons.error) return <ErrorBox error={seasons.error} />

  return (
    <>
      <PageHeader title={t.common.seasons} subtitle={t.seasons.overviewSubtitle} />
      {seasons.data.length === 0 ? (
        <Empty>{t.seasons.noSeason}</Empty>
      ) : (
        <>
          <SeasonJumpList seasons={seasons.data} />
          <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
            {seasons.data.map(({ season, rows, tied_not_shown, main_event_champion: champion }) => (
              // The target of the list above. scroll-mt keeps the title clear of the sticky header.
              <div key={season.id} id={seasonAnchor(season.id)} tabIndex={-1} className="min-w-0 scroll-mt-28 rounded-lg outline-none">
                <Card
                  title={season.name}
                  action={
                    <span className="flex max-w-full min-w-0 flex-wrap items-center gap-2">
                      <SeasonBadge season={season} isCurrent={season.id === defaultSeason?.id} />
                      {season.id === selected?.id ? (
                        <span className="flex min-h-touch items-center text-sm font-semibold text-primary">{t.seasons.selected}</span>
                      ) : (
                        <Button variant="secondary" className="max-w-full min-w-0 wrap-anywhere" onPress={() => pick(season)} aria-label={t.seasons.viewSeason({ season: season.name })}>
                          {t.seasons.view}
                        </Button>
                      )}
                    </span>
                  }
                >
                  <p className="-mt-2 mb-2 text-sm text-muted">
                    {t.seasons.started({ date: formatDate(season.starts_on), count: playedRounds(season) })}
                  </p>
                  {hasFeature('mainEvent') &&
                    (champion ? (
                      // In the site's color, so it does not read as one more row of the list under it.
                      <MainEventBox className="border-primary bg-primary-soft">
                        <span aria-hidden className="text-xl">🏅</span>
                        <span className="text-sm font-semibold text-primary">{t.seasons.mainEventChampion}</span>
                        <span className="flex min-w-0 items-center gap-2">
                          <PlayerThumbnail player={champion} size="xs" />
                          <PlayerLink player={champion} className="min-w-0 font-display text-lg font-extrabold" />
                        </span>
                      </MainEventBox>
                    ) : (
                      // Holds the champion's place, so the lists of two seasons side by side start at the same height.
                      <MainEventBox className="border-border bg-surface-sunken">
                        <span className="text-sm text-muted">{season.is_finished ? t.seasons.mainEventNone : t.seasons.mainEventPending}</span>
                      </MainEventBox>
                    ))}
                  {rows.length === 0 ? (
                    <p className="text-muted">{t.seasons.noResults}</p>
                  ) : (
                    <SeasonTopTen caption={t.seasons.topTenCaption({ season: season.name })} rows={rows} tiedNotShown={tied_not_shown} />
                  )}
                </Card>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}

const seasonAnchor = (id: number) => `s${id}`

/** The box under a season's start date: its Main Event champion, or why there is none. Both have the same height. */
function MainEventBox({ className, children }: { className: string; children: ReactNode }) {
  return <p className={`mb-4 flex min-h-12 flex-wrap items-center gap-x-2 gap-y-1 rounded-md border-l-4 px-3 py-2 ${className}`}>{children}</p>
}

/**
 * A line for each season, in the same order as the cards, with its winner: the Main Event champion when there is
 * one, else the 1st of its standings. A click scrolls to the season's card.
 */
function SeasonJumpList({ seasons }: { seasons: SeasonTopStandings[] }) {
  // Scrolls to the card and moves the focus to it, so the keyboard and screen readers follow.
  const jump = (id: number) => {
    const card = document.getElementById(seasonAnchor(id))
    if (!card) return
    card.focus({ preventScroll: true })
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    card.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <nav aria-label={t.seasons.jumpLabel} className="mb-4 rounded-lg bg-surface p-2 shadow-card">
      <ul className="grid grid-cols-1 md:grid-cols-2 md:gap-x-4">
        {seasons.map(({ season, rows, main_event_champion: champion }) => {
          const showChampion = hasFeature('mainEvent') && champion
          const leaders = rows.filter((row) => row.rank === 1)
          return (
            <li key={season.id}>
              {/* With large text the winner goes to a line of its own, at the right. */}
              <Button variant="ghost" fullWidth className="flex-wrap justify-between! gap-x-3 gap-y-0 px-2 py-1 text-left text-text" onPress={() => jump(season.id)}>
                <span className="min-w-0 wrap-anywhere">{season.name}</span>
                {showChampion ? (
                  <span className="ml-auto min-w-0 text-right font-normal wrap-anywhere">
                    <span aria-hidden>🏅 </span>
                    <span className="sr-only">{t.seasons.mainEventChampion} </span>
                    {champion.nickname}
                  </span>
                ) : (
                  leaders.length > 0 && (
                    <span className="ml-auto min-w-0 text-right font-normal wrap-anywhere">
                      <span className="text-muted">{t.seasons.leader}</span> {leaders.map((row) => row.player.nickname).join(', ')}
                    </span>
                  )
                )}
              </Button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
