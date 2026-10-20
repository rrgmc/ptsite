import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { RankedList as RankedListData, Statistics } from '@/api/client'
import { useStatistics } from '@/api/queries'
import { PageHeader } from '@/components/Card'
import { Empty, ErrorBox, Loading } from '@/components/Feedback'
import { PeriodSwitch } from '@/components/PeriodSwitch'
import { PlayerLink } from '@/components/PlayerLink'
import { PlayerThumbnail } from '@/components/PlayerThumbnail'
import { Podium } from '@/components/Podium'
import { RankedList, type RankedRow } from '@/components/RankedList'
import { StatTiles } from '@/components/StatTiles'
import { TabBox, type TabBoxTab } from '@/components/TabBox'
import { t } from '@/i18n'
import { formatMoney, formatPoints, nightTitle } from '@/lib/format'
import { useSeasonPath } from '@/lib/seasonPath'
import { useSelectedSeason } from '../layout/useSelectedSeason'
import { amountRows } from '../nights/amounts'
import { PositionTable } from './PositionTable'
import { titlePlaces } from './titlePlaces'
import { PlacesChart, PointsProgressChart, PotsChart, RankProgressChart, RebuysChart, subtitle, WinsChart } from './StatisticsCharts'

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
      <PeriodSwitch seasonTo={to('/statistics')} allTimeTo="/statistics/all" allTime={allTime} allTimeFirst />
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

/**
 * Over every season, the first three places by titles: of the seasons' final standings, then of the Main Event.
 * Players with as many titles share a place, and the next number of titles is the next place ({@link titlePlaces}).
 */
function ChampionPodiums({ championships, mainEvent }: { championships: Statistics['championships']; mainEvent: Statistics['main_event'] }) {
  const lines = (list: RankedListData) =>
    titlePlaces(list.rows.map((row) => ({ player: row.player!, count: row.count ?? 0 })))
      .map((row) => ({ rank: row.rank, player: row.player, note: t.statistics.titlesCount({ count: row.count }) }))
  return (
    // Side by side from a tablet's width up, one over the other on a phone.
    <div className={`grid grid-cols-1 items-start gap-3 ${championships && mainEvent ? 'md:grid-cols-2' : ''}`}>
      {championships && (
        <Podium compact title={t.statistics.seasonChampions} caption={t.statistics.championshipTitlesCaption} lines={lines(championships.titles)} />
      )}
      {mainEvent && (
        <Podium compact title={t.statistics.mainEventChampions} caption={t.statistics.mainEventTitlesCaption} lines={lines(mainEvent.titles)} />
      )}
    </div>
  )
}

/** One list inside a tab that holds several, under its own small title. */
function ListBlock({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 ${className}`}>
      <h2 className={subtitle}>{title}</h2>
      {children}
    </section>
  )
}

/** A top ten list of players by a count: nights scored, Main Events won. `empty` is shown in place of a list with no lines. */
function CountList({ title, caption, valueHeader, list, empty }: { title: string; caption: string; valueHeader: string; list: RankedListData; empty?: string }) {
  return (
    <ListBlock title={title}>
      {empty !== undefined && list.rows.length === 0 ? (
        <Empty>{empty}</Empty>
      ) : (
        <RankedList compact caption={caption} labelHeader={t.common.player} valueHeader={valueHeader} rows={playerRows(list, (row) => row.count ?? 0)} tiedNotShown={list.tied_not_shown} />
      )}
    </ListBlock>
  )
}

const TAB_ORDER = ['positions', 'championships', 'main-event', 'players', 'nights', 'rebuys']

/**
 * The numbers of one view: the totals, the points chart, the lists and other charts in a box with tabs, and over
 * every season the rank by season under them.
 */
export function StatisticsView({ statistics }: { statistics: Statistics }) {
  const allTime = statistics.season_id === null
  // One season has one Main Event, which makes no list: the Main Event lists are of every season.
  const mainEvent = allTime && statistics.main_event && statistics.main_event.count > 0 ? statistics.main_event : null
  // The final standings of the finished seasons; a season's own are on "Classificação".
  const championships = statistics.championships && statistics.championships.count > 0 ? statistics.championships : null
  const hasNights = statistics.nights_count > 0
  // A season known only by its final standings has no night of its own: no pot, no place and no progress.
  const nightsKnown = statistics.points_progress.steps.length > 0
  if (!hasNights && !mainEvent) return <Empty>{t.statistics.noNights}</Empty>

  const rebuys = hasNights ? statistics.rebuys : null
  const tabs: TabBoxTab[] = []
  if (hasNights) {
    tabs.push(
      {
        id: 'positions',
        title: t.statistics.positions,
        content: (
          // On a wide screen "Vitórias" is at the right of the table, in the width the table leaves.
          <div className="flex flex-col gap-x-10 gap-y-6 lg:flex-row lg:items-start">
            <div className="min-w-0"><PositionTable rows={statistics.position_table} /></div>
            <WinsChart bare className="lg:flex-1" statistics={statistics} />
          </div>
        ),
      },
      {
        id: 'players',
        title: t.common.players,
        content: (
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
        ),
      },
    )
  }
  if (hasNights && nightsKnown) {
    tabs.push(
      {
        id: 'nights',
        title: t.common.nights,
        content: (
          // On a wide screen the charts are one over the other, beside the list.
          <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
            <PotsChart className="md:col-span-2" progress={statistics.points_progress} perSeason={allTime} />
            <ListBlock title={t.statistics.biggestPots} className={rebuys ? 'lg:row-span-3' : 'lg:row-span-2'}>
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
            {rebuys && <RebuysChart className="md:col-span-2" progress={statistics.points_progress} rebuys={rebuys} perSeason={allTime} />}
            {statistics.places.rows.length === 0 ? (
              <ListBlock title={t.statistics.places} className="lg:col-span-2"><Empty>{t.statistics.noPlaces}</Empty></ListBlock>
            ) : (
              <PlacesChart className="lg:col-span-2" places={statistics.places} />
            )}
          </div>
        ),
      },
    )
  }
  if (rebuys) {
    tabs.push({
      id: 'rebuys',
      title: t.statistics.rebuysTab,
      content: (
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 md:grid-cols-3">
          <CountList title={t.statistics.rebuys} caption={t.statistics.rebuysCaption} valueHeader={t.statistics.times} list={rebuys.rebuys} empty={t.statistics.noneRecorded} />
          <CountList title={t.statistics.moneyOnlyRebuys} caption={t.statistics.moneyOnlyRebuysCaption} valueHeader={t.statistics.times} list={rebuys.money_only_rebuys} empty={t.statistics.noneRecorded} />
          {rebuys.time_chips && (
            <CountList title={t.statistics.timeChips} caption={t.statistics.timeChipsCaption} valueHeader={t.statistics.times} list={rebuys.time_chips} empty={t.statistics.noneRecorded} />
          )}
        </div>
      ),
    })
  }
  if (championships) {
    tabs.push({
      id: 'championships',
      title: t.statistics.championships,
      content: (
        <div className="grid grid-cols-2 gap-x-8 gap-y-5 md:grid-cols-3">
          <CountList title={t.statistics.championshipTitles} caption={t.statistics.championshipTitlesCaption} valueHeader={t.statistics.times} list={championships.titles} />
          <CountList title={t.statistics.championshipPodiums} caption={t.statistics.championshipPodiumsCaption} valueHeader={t.statistics.times} list={championships.podiums} />
          <CountList title={t.statistics.championshipAppearances} caption={t.statistics.championshipAppearancesCaption} valueHeader={t.statistics.times} list={championships.appearances} />
        </div>
      ),
    })
  }
  if (mainEvent) {
    tabs.push({
      id: 'main-event',
      title: t.statistics.mainEvent,
      content: (
        <div className="grid grid-cols-2 gap-x-8 gap-y-5 md:grid-cols-3">
          <CountList title={t.statistics.mainEventTitles} caption={t.statistics.mainEventTitlesCaption} valueHeader={t.statistics.times} list={mainEvent.titles} />
          <CountList title={t.statistics.mainEventPodiums} caption={t.statistics.mainEventPodiumsCaption} valueHeader={t.statistics.times} list={mainEvent.podiums} />
          <CountList title={t.statistics.mainEventAppearances} caption={t.statistics.mainEventAppearancesCaption} valueHeader={t.statistics.times} list={mainEvent.appearances} />
        </div>
      ),
    })
  }

  // The titles come right after the positions; the lists of players and nights follow.
  tabs.sort((a, b) => TAB_ORDER.indexOf(a.id) - TAB_ORDER.indexOf(b.id))

  return (
    <div className="flex flex-col gap-4">
      <StatTiles
        tiles={[
          { label: t.common.nights, value: statistics.nights_count },
          ...amountRows({ pot: statistics.pot_total, mainEventPot: statistics.main_event_pot_total, timeChip: statistics.time_chip_total })
            .map(([label, amount]) => ({ label, value: formatMoney(amount) })),
          ...(rebuys
            ? [
                { label: t.statistics.rebuys, value: rebuys.rebuy_count },
                { label: t.statistics.moneyOnlyRebuys, value: rebuys.money_only_rebuy_count },
                ...(rebuys.time_chip_count === null ? [] : [{ label: t.statistics.timeChips, value: rebuys.time_chip_count }]),
              ]
            : []),
        ]}
      />
      {allTime && (championships || mainEvent) && <ChampionPodiums championships={championships} mainEvent={mainEvent} />}
      {hasNights && nightsKnown && <PointsProgressChart progress={statistics.points_progress} perSeason={allTime} />}
      <TabBox label={t.statistics.tabs} tabs={tabs} />
      {statistics.rank_progress && statistics.rank_progress.length > 0 && statistics.points_progress.steps.length >= 2 && (
        <RankProgressChart steps={statistics.points_progress.steps} rankProgress={statistics.rank_progress} />
      )}
    </div>
  )
}
