import { Link } from 'react-router'
import type { RankedList as RankedListData, Statistics } from '@/api/client'
import { useStatistics } from '@/api/queries'
import { Card, PageHeader } from '@/components/Card'
import { Empty, ErrorBox, Loading } from '@/components/Feedback'
import { PeriodSwitch } from '@/components/PeriodSwitch'
import { PlayerLink } from '@/components/PlayerLink'
import { PlayerThumbnail } from '@/components/PlayerThumbnail'
import { RankedList, type RankedRow } from '@/components/RankedList'
import { formatMoney, formatPoints, nightTitle, ordinal } from '@/lib/format'
import { useSelectedSeason } from '../layout/useSelectedSeason'
import { PointsProgressChart, WinsChart } from './StatisticsCharts'

/** "Estatísticas" of the selected season (docs/specs/statistics.md). */
export function StatisticsPage() {
  const { season, isPending, error } = useSelectedSeason()
  const statistics = useStatistics(season?.id)

  if (isPending) return <Loading />
  if (error) return <ErrorBox error={error} />
  if (!season) return <Empty>Nenhuma temporada cadastrada.</Empty>

  return <StatisticsScreen subtitle={season.name} allTime={false} query={statistics} />
}

/** "Estatísticas" of every season. */
export function AllTimeStatisticsPage() {
  return <StatisticsScreen subtitle="Todas as temporadas" allTime query={useStatistics(null)} />
}

function StatisticsScreen({ subtitle, allTime, query }: { subtitle: string; allTime: boolean; query: ReturnType<typeof useStatistics> }) {
  return (
    <>
      <PageHeader title="Estatísticas" subtitle={subtitle} />
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
  if (statistics.nights_count === 0) return <Empty>Nenhum evento finalizado ainda.</Empty>

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted">
        {statistics.nights_count} {statistics.nights_count === 1 ? 'evento' : 'eventos'} · Pote total {formatMoney(statistics.pot_total)}
      </p>

      {/* On a wide screen the line chart takes three quarters of the width. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <PointsProgressChart progress={statistics.points_progress} perSeason={allTime} />
        </div>
        <WinsChart statistics={statistics} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Pontuação Total">
          <RankedList
            caption="Jogadores por pontuação total"
            labelHeader="Jogador"
            valueHeader="Pontos"
            rows={playerRows(statistics.total_points, (row) => formatPoints(row.amount ?? 0))}
            tiedNotShown={statistics.total_points.tied_not_shown}
          />
        </Card>
        <Card title="Eventos Pontuando">
          <RankedList
            caption="Jogadores por eventos em que pontuaram"
            labelHeader="Jogador"
            valueHeader="Eventos"
            rows={playerRows(statistics.nights_scored, (row) => row.count ?? 0)}
            tiedNotShown={statistics.nights_scored.tied_not_shown}
          />
        </Card>
        <Card title="Maiores Potes">
          <RankedList
            caption="Eventos por pote"
            labelHeader="Evento"
            valueHeader="Pote"
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
        <Card title="Locais">
          {statistics.places.rows.length === 0 ? <Empty>Nenhum evento com local.</Empty> : (
            <RankedList
              caption="Locais por número de eventos"
              labelHeader="Local"
              valueHeader="Eventos"
              rows={statistics.places.rows.map((row) => ({ key: row.place!.id, rank: row.rank, label: <span className="font-semibold wrap-anywhere">{row.place!.name}</span>, value: row.count ?? 0 }))}
              tiedNotShown={statistics.places.tied_not_shown}
            />
          )}
        </Card>
        {statistics.positions.map((list) => (
          <Card key={list.position} title={`Posição: ${ordinal(list.position!)}`}>
            <RankedList
              caption={`Jogadores por vezes em ${ordinal(list.position!)} lugar`}
              labelHeader="Jogador"
              valueHeader="Vezes"
              rows={playerRows(list, (row) => row.count ?? 0)}
              tiedNotShown={list.tied_not_shown}
            />
          </Card>
        ))}
      </div>
    </div>
  )
}
