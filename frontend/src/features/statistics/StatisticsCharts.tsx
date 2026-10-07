import type { ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Statistics } from '@/api/client'
import { formatPoints } from '@/lib/format'
import { progressData, SERIES_COLORS, winsData } from './chartData'
import { cell, head, highestFirst, tick, tooltip } from './chartStyle'

/**
 * A chart with its title, a short description for screen readers, and the same numbers as a table
 * ("Ver dados em tabela"), so nothing is told by color or by sight alone.
 */
export function Figure({ title, description, legend, table, children }: { title: string; description: string; legend?: ReactNode; table: ReactNode; children: ReactNode }) {
  return (
    // min-w-0: in a grid, the box may be narrower than its data table, which then scrolls inside it.
    <figure className="min-w-0 rounded-lg bg-surface p-4 shadow-card">
      <figcaption className="mb-3 font-display text-lg font-bold">{title}</figcaption>
      {legend}
      <div role="img" aria-label={description}>{children}</div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-semibold text-primary">Ver dados em tabela</summary>
        <div className="mt-2 overflow-x-auto">{table}</div>
      </details>
    </figure>
  )
}

/** "Pontos acumulados": the running total of the eight players with most points. */
export function PointsProgressChart({ progress, perSeason }: { progress: Statistics['points_progress']; perSeason: boolean }) {
  const { series, points } = progressData(progress)
  const leader = series[0]?.nickname
  return (
    <Figure
      title="Pontos acumulados"
      description={`Gráfico de linhas: pontos acumulados dos ${series.length} jogadores com mais pontos, por ${perSeason ? 'temporada' : 'evento'}.${leader ? ` ${leader} lidera.` : ''} Os números estão na tabela abaixo.`}
      legend={
        <ul aria-label="Legenda" className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-2">
              <span aria-hidden className="inline-block h-1 w-5 rounded-full" style={{ background: s.color }} />
              {s.nickname}
            </li>
          ))}
        </ul>
      }
      table={
        <table className="w-full border-collapse">
          <caption className="sr-only">Pontos acumulados por {perSeason ? 'temporada' : 'evento'}</caption>
          <thead>
            <tr>
              <th scope="col" className={`${head} text-left`}>{perSeason ? 'Temporada' : 'Evento'}</th>
              {series.map((s) => <th key={s.key} scope="col" className={head}>{s.nickname}</th>)}
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.label} className="even:bg-surface-stripe">
                <th scope="row" className={`${cell} text-left font-semibold`}>{point.label}</th>
                {series.map((s) => <td key={s.key} className={cell}>{formatPoints(point[s.key])}</td>)}
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
            <YAxis tick={tick} tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => v.toLocaleString('pt-BR')} />
            <Tooltip {...tooltip} cursor={{ stroke: 'var(--color-muted)' }} itemSorter={highestFirst} formatter={(value) => formatPoints(Number(value))} />
            {series.map((s) => (
              <Line
                key={s.key}
                dataKey={s.key}
                name={s.nickname}
                type="linear"
                stroke={s.color}
                strokeWidth={2}
                dot={points.length <= 12 ? { r: 4, fill: s.color, stroke: 'var(--color-surface)', strokeWidth: 2 } : false}
                activeDot={{ r: 5, stroke: 'var(--color-surface)', strokeWidth: 2 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Figure>
  )
}

/** "Vitórias": who finished first most often, with everyone else added up as "Outros". */
export function WinsChart({ statistics }: { statistics: Statistics }) {
  const bars = winsData(statistics)
  const others = statistics.wins_not_shown
  return (
    <Figure
      title="Vitórias"
      description={`Gráfico de barras: vitórias por jogador.${bars[0] ? ` ${bars[0].nickname} tem mais: ${bars[0].wins}.` : ''} Os números estão na tabela abaixo.`}
      table={
        <table className="w-full border-collapse">
          <caption className="sr-only">Vitórias por jogador</caption>
          <thead>
            <tr>
              <th scope="col" className={`${head} text-left`}>Jogador</th>
              <th scope="col" className={head}>Vitórias</th>
            </tr>
          </thead>
          <tbody>
            {bars.map((bar) => (
              <tr key={bar.key} className="even:bg-surface-stripe">
                <th scope="row" className={`${cell} text-left font-semibold`}>{bar.nickname}</th>
                <td className={cell}>{bar.wins}</td>
              </tr>
            ))}
            {others > 0 && (
              <tr className="even:bg-surface-stripe">
                <th scope="row" className={`${cell} text-left font-semibold`}>Outros</th>
                <td className={cell}>{others}</td>
              </tr>
            )}
          </tbody>
        </table>
      }
    >
      {/* One row per bar, so the bars keep their thickness whatever their number. */}
      <div style={{ height: `${bars.length * 2 + 1}rem` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bars} layout="vertical" accessibilityLayer={false} margin={{ top: 0, right: 32, bottom: 0, left: 0 }} barCategoryGap={6}>
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis type="category" dataKey="nickname" tick={{ ...tick, fill: 'var(--color-text)' }} tickLine={false} axisLine={false} width={96} interval={0} />
            <Tooltip {...tooltip} cursor={{ fill: 'var(--color-surface-sunken)' }} formatter={(value) => [value, 'Vitórias']} />
            <Bar dataKey="wins" name="Vitórias" fill={SERIES_COLORS[0]} radius={[0, 4, 4, 0]} isAnimationActive={false}>
              <LabelList dataKey="wins" position="right" fill="var(--color-text)" fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {others > 0 && <p className="mt-2 text-sm text-muted">Outros: {others}</p>}
    </Figure>
  )
}
