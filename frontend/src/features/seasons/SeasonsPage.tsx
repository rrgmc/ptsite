import { useSeasonsTopStandings } from '@/api/queries'
import { Button } from '@/components/Button'
import { Card, PageHeader } from '@/components/Card'
import { Empty, ErrorBox, Loading } from '@/components/Feedback'
import { t } from '@/i18n'
import { formatDate } from '@/lib/format'
import { SeasonBadge } from './SeasonBadge'
import { SeasonTopTen } from './SeasonTopTen'
import { usePickSeason } from './usePickSeason'

/**
 * "Temporadas", from the menu: every season, newest first, each with the first ten of its standings. A season can
 * be made the one that every screen shows.
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
        <div className="grid grid-cols-1 gap-4">
          {seasons.data.map(({ season, rows, tied_not_shown }) => (
            <Card
              key={season.id}
              title={season.name}
              action={
                <span className="flex flex-wrap items-center gap-2">
                  <SeasonBadge season={season} isCurrent={season.id === defaultSeason?.id} />
                  {season.id === selected?.id ? (
                    <span className="flex min-h-touch items-center text-sm font-semibold text-primary">{t.seasons.selected}</span>
                  ) : (
                    <Button variant="secondary" onPress={() => pick(season)} aria-label={t.seasons.viewSeason({ season: season.name })}>
                      {t.seasons.view}
                    </Button>
                  )}
                </span>
              }
            >
              <p className="-mt-2 mb-2 text-sm text-muted">
                {t.seasons.started({ date: formatDate(season.starts_on), count: season.nights_count ?? 0 })}
              </p>
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
