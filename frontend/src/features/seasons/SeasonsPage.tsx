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
import { SeasonTopTen } from './SeasonTopTen'
import { usePickSeason } from './usePickSeason'

/**
 * "Temporadas", from the menu: every season, newest first, each with the first ten of its standings and, on a
 * site that has the Main Event, its Main Event champion. From a tablet up, two seasons stand side by side. A
 * season can be made the one that every screen shows.
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
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
          {seasons.data.map(({ season, rows, tied_not_shown, main_event_champion: champion }) => (
            <Card
              key={season.id}
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
                {t.seasons.started({ date: formatDate(season.starts_on), count: season.nights_count ?? 0 })}
              </p>
              {hasFeature('mainEvent') && champion && (
                // A box in the site's color, so it does not read as one more row of the list under it.
                <p className="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border-l-4 border-primary bg-primary-soft px-3 py-2">
                  <span aria-hidden className="text-xl">🏅</span>
                  <span className="text-sm font-semibold text-primary">{t.seasons.mainEventChampion}</span>
                  <span className="flex min-w-0 items-center gap-2">
                    <PlayerThumbnail player={champion} size="xs" />
                    <PlayerLink player={champion} className="min-w-0 font-display text-lg font-extrabold" />
                  </span>
                </p>
              )}
              {rows.length === 0 ? (
                <p className="text-muted">{t.seasons.noResults}</p>
              ) : (
                <SeasonTopTen caption={t.seasons.topTenCaption({ season: season.name })} rows={rows} tiedNotShown={tied_not_shown} />
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
