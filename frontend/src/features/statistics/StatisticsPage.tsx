import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { RankedList as RankedListData, Statistics } from '@/api/client'
import { useStatistics } from '@/api/queries'
import { PageHeader } from '@/components/Card'
import { Empty, ErrorBox, Loading } from '@/components/Feedback'
import { FoldPanel } from '@/components/FoldPanel'
import { PeriodSwitch } from '@/components/PeriodSwitch'
import { PlayerLink } from '@/components/PlayerLink'
import { PlayerThumbnail } from '@/components/PlayerThumbnail'
import { RankedList, type RankedRow } from '@/components/RankedList'
import { StatTiles } from '@/components/StatTiles'
import { t } from '@/i18n'
import { formatMoney, formatPoints, nightTitle } from '@/lib/format'
import { useSeasonPath } from '@/lib/seasonPath'
import { useSelectedSeason } from '../layout/useSelectedSeason'
import { amountRows } from '../nights/amounts'
import { PositionTable } from './PositionTable'
import { PlacesChart, PointsProgressChart, PotsChart, subtitle, WinsChart } from './StatisticsCharts'

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
      <span className="flex items-center gap-2">
        <PlayerThumbnail player={row.player!} size="xs" />
        <PlayerLink player={row.player!} className="min-w-0 truncate font-semibold" />
      </span>
    ),
    value: value(row),
  }))
}

/** One list inside a box that holds several, under its own small title. */
function ListBlock({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 ${className}`}>
      <h3 className={subtitle}>{title}</h3>
      {children}
    </section>
  )
}

/** A top ten list of players by a count: nights scored, Main Events won. */
function CountList({ title, caption, valueHeader, list }: { title: string; caption: string; valueHeader: string; list: RankedListData }) {
  return (
    <ListBlock title={title}>
      <RankedList compact caption={caption} labelHeader={t.common.player} valueHeader={valueHeader} rows={playerRows(list, (row) => row.count ?? 0)} tiedNotShown={list.tied_not_shown} />
    </ListBlock>
  )
}

/** The numbers of one view: the totals, the two leading charts and the lists, grouped in boxes that fold. */
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

          <FoldPanel title={t.common.players}>
            <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              <ListBlock title={t.statistics.totalPoints}>
                <RankedList
                  compact
                  caption={t.statistics.totalPointsCaption}
                  labelHeader={t.common.player}
                  valueHeader={t.common.points}
                  rows={playerRows(statistics.total_points, (row) => formatPoints(row.amount ?? 0))}
                  tiedNotShown={statistics.total_points.tied_not_shown}
                />
              </ListBlock>
              <CountList title={t.statistics.nightsScored} caption={t.statistics.nightsScoredCaption} valueHeader={t.common.nights} list={statistics.nights_scored} />
            </div>
          </FoldPanel>

          <FoldPanel title={t.common.nights}>
            {/* On a wide screen the two charts are one over the other, beside the list. */}
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
              <PotsChart className="md:col-span-2" progress={statistics.points_progress} perSeason={allTime} />
              <ListBlock title={t.statistics.biggestPots} className="lg:row-span-2">
                <RankedList
                  compact
                  caption={t.statistics.biggestPotsCaption}
                  labelHeader={t.common.night}
                  valueHeader={t.common.pot}
                  rows={statistics.biggest_pots.rows.map((row) => ({
                    key: row.night!.id,
                    rank: row.rank,
                    label: (
                      <>
                        <Link to={`/nights/${row.night!.id}`} className="inline-block py-0.5 font-semibold text-primary underline">{nightTitle(row.night!.starts_at)}</Link>
                        {allTime && <span className="block text-xs text-muted">{row.night!.season_name}</span>}
                      </>
                    ),
                    value: formatMoney(row.amount),
                  }))}
                  tiedNotShown={statistics.biggest_pots.tied_not_shown}
                />
              </ListBlock>
              {statistics.places.rows.length === 0 ? (
                <ListBlock title={t.statistics.places} className="lg:col-span-2"><Empty>{t.statistics.noPlaces}</Empty></ListBlock>
              ) : (
                <PlacesChart className="lg:col-span-2" places={statistics.places} />
              )}
            </div>
          </FoldPanel>

          <FoldPanel title={t.statistics.positions}>
            <PositionTable rows={statistics.position_table} />
          </FoldPanel>
        </>
      )}

      {mainEvent && (
        <FoldPanel title={t.statistics.mainEvent}>
          <div className="grid grid-cols-2 gap-x-8 gap-y-5 md:grid-cols-3">
            <CountList title={t.statistics.mainEventTitles} caption={t.statistics.mainEventTitlesCaption} valueHeader={t.statistics.times} list={mainEvent.titles} />
            <CountList title={t.statistics.mainEventPodiums} caption={t.statistics.mainEventPodiumsCaption} valueHeader={t.statistics.times} list={mainEvent.podiums} />
            <CountList title={t.statistics.mainEventAppearances} caption={t.statistics.mainEventAppearancesCaption} valueHeader={t.statistics.times} list={mainEvent.appearances} />
          </div>
        </FoldPanel>
      )}
    </div>
  )
}
