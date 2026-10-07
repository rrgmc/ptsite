import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PlayerStatistics } from '@/api/client'
import { formatPoints, formatWhole } from '@/lib/format'
import { playerProgressData, positionsData, SERIES_COLORS } from './chartData'
import { cell, head, tick, tooltip } from './chartStyle'
import { Figure } from './StatisticsCharts'

/** The two charts of a player's page. They load apart from the page, with the chart library. */
export function PlayerCharts({ statistics, nickname }: { statistics: PlayerStatistics; nickname: string }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <PlayerPointsChart progress={statistics.points_progress} perSeason={statistics.season_id === null} nickname={nickname} />
      <PlayerPositionsChart positions={statistics.positions} nickname={nickname} />
    </div>
  )
}

/** "Pontos acumulados": one player's running total. */
export function PlayerPointsChart({ progress, perSeason, nickname }: { progress: PlayerStatistics['points_progress']; perSeason: boolean; nickname: string }) {
  const points = playerProgressData(progress)
  const last = points.at(-1)
  return (
    <Figure
      title="Pontos acumulados"
      description={`Gráfico de linha: pontos acumulados de ${nickname}, por ${perSeason ? 'temporada' : 'evento'}.${last ? ` Chega a ${formatPoints(last.points)}.` : ''} Os números estão na tabela abaixo.`}
      table={
        <table className="w-full border-collapse">
          <caption className="sr-only">Pontos acumulados de {nickname} por {perSeason ? 'temporada' : 'evento'}</caption>
          <thead>
            <tr>
              <th scope="col" className={`${head} text-left`}>{perSeason ? 'Temporada' : 'Evento'}</th>
              <th scope="col" className={head}>Pontos</th>
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
            <Tooltip {...tooltip} cursor={{ stroke: 'var(--color-muted)' }} formatter={(value) => [formatPoints(Number(value)), 'Pontos']} />
            <Line
              dataKey="points"
              name="Pontos"
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
      title="Posições"
      description={`Gráfico de barras: vezes em que ${nickname} terminou em cada posição.${best ? ` A mais frequente é ${best.label}: ${best.count}.` : ''} Os números estão na tabela abaixo.`}
      table={
        <table className="w-full border-collapse">
          <caption className="sr-only">Vezes em que {nickname} terminou em cada posição</caption>
          <thead>
            <tr>
              <th scope="col" className={`${head} text-left`}>Posição</th>
              <th scope="col" className={head}>Vezes</th>
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
            <Tooltip {...tooltip} cursor={{ fill: 'var(--color-surface-sunken)' }} formatter={(value) => [value, 'Vezes']} />
            <Bar dataKey="count" name="Vezes" fill={SERIES_COLORS[0]} radius={[0, 4, 4, 0]} isAnimationActive={false}>
              <LabelList dataKey="count" position="right" fill="var(--color-text)" fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Figure>
  )
}
