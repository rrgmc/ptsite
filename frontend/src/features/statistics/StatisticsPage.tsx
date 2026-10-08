import { Link } from 'react-router'
import type { RankedList as RankedListData, Statistics } from '@/api/client'
import { useStatistics } from '@/api/queries'
import { Card, PageHeader } from '@/components/Card'
import { Empty, ErrorBox, Loading } from '@/components/Feedback'
import { PeriodSwitch } from '@/components/PeriodSwitch'
import { PlayerLink } from '@/components/PlayerLink'
import { PlayerThumbnail } from '@/components/PlayerThumbnail'
import { RankedList, type RankedRow } from '@/components/RankedList'
import { StatTiles } from '@/components/StatTiles'
import { t } from '@/i18n'
import { formatMoney, formatPoints, nightTitle, ordinal } from '@/lib/format'
import { useSeasonPath } from '@/lib/seasonPath'
import { useSelectedSeason } from '../layout/useSelectedSeason'
import { amountRows } from '../nights/amounts'
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
  const to = useSeasonPath()
  return (
    <>
      <PageHeader title={t.statistics.title} subtitle={subtitle} />
      <PeriodSwitch seasonTo={to('/statistics')} allTimeTo="/statistics/all" allTime={allTime} />
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

/** A top ten list of players by a count: nights scored, times in a position, Main Events won. */
function CountCard({ title, caption, valueHeader, list }: { title: string; caption: string; valueHeader: string; list: RankedListData }) {
  return (
    <Card title={title}>
      <RankedList caption={caption} labelHeader={t.common.player} valueHeader={valueHeader} rows={playerRows(list, (row) => row.count ?? 0)} tiedNotShown={list.tied_not_shown} />
    </Card>
  )
}

/** The lists stand one under the other on a phone, two across on a tablet and three across on a wide screen. */
const lists = 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'

/** The numbers of one view: the totals, the two charts and the top ten lists. */
export function StatisticsView({ statistics }: { statistics: Statistics }) {
  const allTime = statistics.season_id === null
  // One season has one Main Event, which makes no list: the Main Event lists are of every season.
  const mainEvent = allTime && statistics.main_event && statistics.main_event.count > 0 ? statistics.main_event : null
  if (statistics.nights_count === 0 && !mainEvent) return <Empty>{t.statistics.noNights}</Empty>

  return (
    <div className="flex flex-col gap-4">
      <StatTiles
        tiles={[
          { label: t.common.nights, value: statistics.nights_count },
          ...amountRows({ pot: statistics.pot_total, mainEventPot: statistics.main_event_pot_total, timeChip: statistics.time_chip_total })
            .map(([label, amount]) => ({ label, value: formatMoney(amount) })),
        ]}
      />

      {statistics.nights_count > 0 && (
        <>
          {/* On a wide screen the line chart takes three quarters of the width, and is as tall as the bar chart. */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <PointsProgressChart className="lg:col-span-3" progress={statistics.points_progress} perSeason={allTime} />
            <WinsChart statistics={statistics} />
          </div>

          <div className={lists}>
            <Card title={t.statistics.totalPoints}>
              <RankedList
                caption={t.statistics.totalPointsCaption}
                labelHeader={t.common.player}
                valueHeader={t.common.points}
                rows={playerRows(statistics.total_points, (row) => formatPoints(row.amount ?? 0))}
                tiedNotShown={statistics.total_points.tied_not_shown}
              />
            </Card>
            <CountCard title={t.statistics.nightsScored} caption={t.statistics.nightsScoredCaption} valueHeader={t.common.nights} list={statistics.nights_scored} />
            {/* The two lists about nights share a column on a wide screen, and a row of their own on a tablet. "Locais" is often short, and takes the height left. */}
            <div className="grid grid-cols-1 gap-4 md:col-span-2 md:grid-cols-2 xl:col-span-1 xl:flex xl:flex-col">
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
              <Card title={t.statistics.places} className="xl:flex-1">
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
            </div>
          </div>

          <div className={lists}>
            {statistics.positions.map((list) => (
              <CountCard
                key={list.position}
                title={t.statistics.positionTitle({ position: ordinal(list.position!) })}
                caption={t.statistics.positionCaption({ position: ordinal(list.position!) })}
                valueHeader={t.statistics.times}
                list={list}
              />
            ))}
          </div>
        </>
      )}

      {mainEvent && (
        // These lists differ much in length, so each box is only as tall as its list.
        <div className={`${lists} items-start`}>
          <CountCard title={t.statistics.mainEventTitles} caption={t.statistics.mainEventTitlesCaption} valueHeader={t.statistics.times} list={mainEvent.titles} />
          <CountCard title={t.statistics.mainEventPodiums} caption={t.statistics.mainEventPodiumsCaption} valueHeader={t.statistics.times} list={mainEvent.podiums} />
          <CountCard title={t.statistics.mainEventAppearances} caption={t.statistics.mainEventAppearancesCaption} valueHeader={t.statistics.times} list={mainEvent.appearances} />
        </div>
      )}
    </div>
  )
}
