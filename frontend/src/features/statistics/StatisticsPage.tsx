import { Link } from 'react-router'
import type { RankedList as RankedListData, Statistics } from '@/api/client'
import { useStatistics } from '@/api/queries'
import { Card, PageHeader } from '@/components/Card'
import { Empty, ErrorBox, Loading } from '@/components/Feedback'
import { PeriodSwitch } from '@/components/PeriodSwitch'
import { PlayerLink } from '@/components/PlayerLink'
import { PlayerThumbnail } from '@/components/PlayerThumbnail'
import { RankedList, type RankedRow } from '@/components/RankedList'
import { t } from '@/i18n'
import { formatMoney, formatPoints, nightTitle, ordinal } from '@/lib/format'
import { useSelectedSeason } from '../layout/useSelectedSeason'
import { PointsProgressChart, WinsChart } from './StatisticsCharts'

/** "Estatísticas" of the selected season (docs/specs/statistics.md). */
export function StatisticsPage() {
  const { season, isPending, error } = useSelectedSeason()
  const statistics = useStatistics(season?.id)

  if (isPending) return <Loading />
  if (error) return <ErrorBox error={error} />
  if (!season) return <Empty>{t.statistics.noSeason}</Empty>

  return <StatisticsScreen subtitle={season.name} allTime={false} query={statistics} />
}

/** "Estatísticas" of every season. */
export function AllTimeStatisticsPage() {
  return <StatisticsScreen subtitle={t.statistics.allSeasons} allTime query={useStatistics(null)} />
}

function StatisticsScreen({ subtitle, allTime, query }: { subtitle: string; allTime: boolean; query: ReturnType<typeof useStatistics> }) {
  return (
    <>
      <PageHeader title={t.statistics.title} subtitle={subtitle} />
      <PeriodSwitch seasonTo="/statistics" allTimeTo="/statistics/all" allTime={allTime} />
      {query.isPending ? <Loading /> : query.error ? <ErrorBox error={query.error} /> : <StatisticsView statistics={query.data!} />}
    </>
  )
}

function playerRows(list: RankedListData, value: (row: RankedListData['rows'][number]) => string | number): RankedRow[] {
  return list.rows.map((row) => ({
    key: row.player!.id,
    rank: row.rank,
    label: (
      <span className="flex items-center gap-3">
        <PlayerThumbnail player={row.player!} />
        <PlayerLink player={row.player!} className="min-w-0 font-semibold" />
      </span>
    ),
    value: value(row),
  }))
}

/** The numbers of one view: the summary line, the two charts and the top ten lists. */
export function StatisticsView({ statistics }: { statistics: Statistics }) {
  const allTime = statistics.season_id === null
  if (statistics.nights_count === 0) return <Empty>{t.statistics.noNights}</Empty>

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted">
        {t.statistics.summary({ count: statistics.nights_count, pot: formatMoney(statistics.pot_total) })}
      </p>

      {/* On a wide screen the line chart takes three quarters of the width. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <PointsProgressChart progress={statistics.points_progress} perSeason={allTime} />
        </div>
        <WinsChart statistics={statistics} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title={t.statistics.totalPoints}>
          <RankedList
            caption={t.statistics.totalPointsCaption}
            labelHeader={t.common.player}
            valueHeader={t.common.points}
            rows={playerRows(statistics.total_points, (row) => formatPoints(row.amount ?? 0))}
            tiedNotShown={statistics.total_points.tied_not_shown}
          />
        </Card>
        <Card title={t.statistics.nightsScored}>
          <RankedList
            caption={t.statistics.nightsScoredCaption}
            labelHeader={t.common.player}
            valueHeader={t.common.nights}
            rows={playerRows(statistics.nights_scored, (row) => row.count ?? 0)}
            tiedNotShown={statistics.nights_scored.tied_not_shown}
          />
        </Card>
        <Card title={t.statistics.biggestPots}>
          <RankedList
            caption={t.statistics.biggestPotsCaption}
            labelHeader={t.common.night}
            valueHeader={t.common.pot}
            rows={statistics.biggest_pots.rows.map((row) => ({
              key: row.night!.id,
              rank: row.rank,
              label: (
                <>
                  <Link to={`/nights/${row.night!.id}`} className="font-semibold text-primary underline">{nightTitle(row.night!.starts_at)}</Link>
                  {allTime && <span className="block text-xs text-muted">{row.night!.season_name}</span>}
                </>
              ),
              value: formatMoney(row.amount),
            }))}
            tiedNotShown={statistics.biggest_pots.tied_not_shown}
          />
        </Card>
        <Card title={t.statistics.places}>
          {statistics.places.rows.length === 0 ? <Empty>{t.statistics.noPlaces}</Empty> : (
            <RankedList
              caption={t.statistics.placesCaption}
              labelHeader={t.common.place}
              valueHeader={t.common.nights}
              rows={statistics.places.rows.map((row) => ({ key: row.place!.id, rank: row.rank, label: <span className="font-semibold wrap-anywhere">{row.place!.name}</span>, value: row.count ?? 0 }))}
              tiedNotShown={statistics.places.tied_not_shown}
            />
          )}
        </Card>
        {statistics.positions.map((list) => (
          <Card key={list.position} title={t.statistics.positionTitle({ position: ordinal(list.position!) })}>
            <RankedList
              caption={t.statistics.positionCaption({ position: ordinal(list.position!) })}
              labelHeader={t.common.player}
              valueHeader={t.statistics.times}
              rows={playerRows(list, (row) => row.count ?? 0)}
              tiedNotShown={list.tied_not_shown}
            />
          </Card>
        ))}
      </div>
    </div>
  )
}
