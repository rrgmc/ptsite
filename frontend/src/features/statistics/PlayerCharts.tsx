import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PlayerStatistics } from '@/api/client'
import { t } from '@/i18n'
import { formatPoints, formatWhole, ordinal } from '@/lib/format'
import { type PlayerRankPoint, playerProgressData, playerRankData, positionsData, rankTicks, SERIES_COLORS } from './chartData'
import { cell, head, tick, tooltip } from './chartStyle'
import { Figure } from './StatisticsCharts'

/**
 * The charts of a player's page: "Classificação por temporada" over every season, for a player of two seasons or
 * more, then the other two. They load apart from the page, with the chart library.
 */
export function PlayerCharts({ statistics, nickname }: { statistics: PlayerStatistics; nickname: string }) {
  const allTime = statistics.season_id === null
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {allTime && statistics.seasons.length >= 2 && <PlayerRankChart seasons={statistics.seasons} nickname={nickname} className="lg:col-span-2" />}
      <PlayerPointsChart progress={statistics.points_progress} perSeason={allTime} nickname={nickname} />
      <PlayerPositionsChart positions={statistics.positions} nickname={nickname} />
    </div>
  )
}

/** "Classificação por temporada": one player's position in each season, 1st at the top, with the Main Event counted. */
export function PlayerRankChart({ seasons, nickname, className }: { seasons: PlayerStatistics['seasons']; nickname: string; className?: string }) {
  const points = playerRankData(seasons)
  const best = points.reduce<PlayerRankPoint | undefined>((top, point) => (point.rank < (top?.rank ?? Infinity) ? point : top), undefined)
  const worst = Math.max(2, ...points.map((point) => point.rank))
  const ticks = rankTicks(worst)
  return (
    <Figure
      className={className}
      title={t.statistics.rankBySeason}
      description={t.statistics.rankBySeasonDescription({ nickname, best: best && { label: best.label, rank: ordinal(best.rank) } })}
      legend={<p className="mb-2 text-sm text-muted">{t.statistics.rankBySeasonNote}</p>}
      table={
        <table className="w-full border-collapse">
          <caption className="sr-only">{t.statistics.rankBySeasonCaption({ nickname })}</caption>
          <thead>
            <tr>
              <th scope="col" className={`${head} text-left`}>{t.common.season}</th>
              <th scope="col" className={head}>{t.common.position}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.label} className="even:bg-surface-stripe">
                <th scope="row" className={`${cell} text-left font-semibold`}>{point.label}</th>
                <td className={cell}>{ordinal(point.rank)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} accessibilityLayer={false} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={{ stroke: 'var(--color-border)' }} minTickGap={24} />
            {/* Reversed, so 1st is at the top and a rising line means a better season. */}
            <YAxis reversed domain={[1, worst]} ticks={ticks} interval={0} tick={tick} tickLine={false} axisLine={false} width={40} tickFormatter={(rank: number) => ordinal(rank)} />
            <Tooltip {...tooltip} cursor={{ stroke: 'var(--color-muted)' }} formatter={(value) => [ordinal(Number(value)), t.common.position]} />
            <Line
              dataKey="rank"
              name={t.common.position}
              type="linear"
              stroke={SERIES_COLORS[0]}
              strokeWidth={2}
              dot={{ r: 4, fill: SERIES_COLORS[0], stroke: 'var(--color-surface)', strokeWidth: 2 }}
              activeDot={{ r: 5, stroke: 'var(--color-surface)', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Figure>
  )
}

/** "Pontos acumulados": one player's running total. */
export function PlayerPointsChart({ progress, perSeason, nickname }: { progress: PlayerStatistics['points_progress']; perSeason: boolean; nickname: string }) {
  const points = playerProgressData(progress)
  const last = points.at(-1)
  return (
    <Figure
      title={t.statistics.pointsProgress}
      description={t.statistics.playerPointsDescription({ nickname, perSeason, total: last ? formatPoints(last.points) : undefined })}
      table={
        <table className="w-full border-collapse">
          <caption className="sr-only">{t.statistics.playerPointsCaption({ nickname, perSeason })}</caption>
          <thead>
            <tr>
              <th scope="col" className={`${head} text-left`}>{perSeason ? t.common.season : t.common.night}</th>
              <th scope="col" className={head}>{t.common.points}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.label} className="even:bg-surface-stripe">
                <th scope="row" className={`${cell} text-left font-semibold`}>{point.label}</th>
                <td className={cell}>{formatPoints(point.points)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} accessibilityLayer={false} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={{ stroke: 'var(--color-border)' }} minTickGap={24} />
            <YAxis tick={tick} tickLine={false} axisLine={false} width={48} tickFormatter={formatWhole} />
            <Tooltip {...tooltip} cursor={{ stroke: 'var(--color-muted)' }} formatter={(value) => [formatPoints(Number(value)), t.common.points]} />
            <Line
              dataKey="points"
              name={t.common.points}
              type="linear"
              stroke={SERIES_COLORS[0]}
              strokeWidth={2}
              dot={points.length <= 12 ? { r: 4, fill: SERIES_COLORS[0], stroke: 'var(--color-surface)', strokeWidth: 2 } : false}
              activeDot={{ r: 5, stroke: 'var(--color-surface)', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Figure>
  )
}

/** "Posições": how often one player finished in each scoring position. */
export function PlayerPositionsChart({ positions, nickname }: { positions: PlayerStatistics['positions']; nickname: string }) {
  const bars = positionsData(positions)
  const best = bars.reduce<(typeof bars)[number] | undefined>((top, bar) => (bar.count > (top?.count ?? 0) ? bar : top), undefined)
  return (
    <Figure
      title={t.statistics.positions}
      description={t.statistics.playerPositionsDescription({ nickname, best })}
      table={
        <table className="w-full border-collapse">
          <caption className="sr-only">{t.statistics.playerPositionsCaption({ nickname })}</caption>
          <thead>
            <tr>
              <th scope="col" className={`${head} text-left`}>{t.common.position}</th>
              <th scope="col" className={head}>{t.statistics.times}</th>
            </tr>
          </thead>
          <tbody>
            {bars.map((bar) => (
              <tr key={bar.label} className="even:bg-surface-stripe">
                <th scope="row" className={`${cell} text-left font-semibold`}>{bar.label}</th>
                <td className={cell}>{bar.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      {/* One row per bar, as in "Vitórias". */}
      <div style={{ height: `${bars.length * 2 + 1}rem` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bars} layout="vertical" accessibilityLayer={false} margin={{ top: 0, right: 32, bottom: 0, left: 0 }} barCategoryGap={6}>
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis type="category" dataKey="label" tick={{ ...tick, fill: 'var(--color-text)' }} tickLine={false} axisLine={false} width={40} interval={0} />
            <Tooltip {...tooltip} cursor={{ fill: 'var(--color-surface-sunken)' }} formatter={(value) => [value, t.statistics.times]} />
            <Bar dataKey="count" name={t.statistics.times} fill={SERIES_COLORS[0]} radius={[0, 4, 4, 0]} isAnimationActive={false}>
              <LabelList dataKey="count" position="right" fill="var(--color-text)" fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Figure>
  )
}
