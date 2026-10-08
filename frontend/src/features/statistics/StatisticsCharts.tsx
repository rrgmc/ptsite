import type { ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Statistics } from '@/api/client'
import { t } from '@/i18n'
import { formatMoney, formatPoints, formatWhole } from '@/lib/format'
import { placesData, potsData, progressData, SERIES_COLORS, winsData } from './chartData'
import { cell, head, highestFirst, tick, tooltip } from './chartStyle'

/** The title of one list or chart inside a box that holds several. */
export const subtitle = 'mb-2 text-xs font-bold uppercase text-muted'

/**
 * A chart with its title, a short description for screen readers, and the same numbers as a table
 * ("Ver dados em tabela"), so nothing is told by color or by sight alone.
 * A bare one has no box of its own, for a chart inside a box that holds other things too.
 */
export function Figure({ title, description, legend, table, children, className = '', bare = false }: { title: string; description: string; legend?: ReactNode; table: ReactNode; children: ReactNode; className?: string; bare?: boolean }) {
  return (
    // min-w-0: in a grid, the box may be narrower than its data table, which then scrolls inside it.
    // A column, so that in a box stretched by its row the chart takes the height left over.
    <figure className={`flex min-w-0 flex-col ${bare ? '' : 'rounded-lg bg-surface p-4 shadow-card'} ${className}`}>
      <figcaption className={bare ? subtitle : 'mb-3 font-display text-lg font-bold'}>{title}</figcaption>
      {legend}
      <div role="img" aria-label={description} className="flex flex-1 flex-col">{children}</div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-semibold text-primary">{t.statistics.viewTable}</summary>
        <div className="mt-2 overflow-x-auto">{table}</div>
      </details>
    </figure>
  )
}

/** "Pontos acumulados": the running total of the eight players with most points. */
export function PointsProgressChart({ progress, perSeason, className }: { progress: Pick<Statistics['points_progress'], 'steps' | 'series'>; perSeason: boolean; className?: string }) {
  const { series, points } = progressData(progress)
  const leader = series[0]?.nickname
  return (
    <Figure
      className={className}
      title={t.statistics.pointsProgress}
      description={t.statistics.pointsProgressDescription({ count: series.length, perSeason, leader })}
      legend={
        <ul aria-label={t.statistics.legend} className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
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
          <caption className="sr-only">{t.statistics.pointsProgressCaption({ perSeason })}</caption>
          <thead>
            <tr>
              <th scope="col" className={`${head} text-left`}>{perSeason ? t.common.season : t.common.night}</th>
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
      {/* At least 16rem high, and taller in a box that its row stretched. The chart is laid over this box, so its own height never sets the box's. */}
      <div className="relative min-h-64 flex-1">
        <ResponsiveContainer width="100%" height="100%" className="absolute inset-0">
          <LineChart data={points} accessibilityLayer={false} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={{ stroke: 'var(--color-border)' }} minTickGap={24} />
            <YAxis tick={tick} tickLine={false} axisLine={false} width={48} tickFormatter={formatWhole} />
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
export function WinsChart({ statistics, bare, className }: { statistics: Statistics; bare?: boolean; className?: string }) {
  const bars = winsData(statistics)
  const others = statistics.wins_not_shown
  return (
    <Figure
      bare={bare}
      className={className}
      title={t.statistics.wins}
      description={t.statistics.winsDescription({ top: bars[0] })}
      table={
        <table className="w-full border-collapse">
          <caption className="sr-only">{t.statistics.winsByPlayer}</caption>
          <thead>
            <tr>
              <th scope="col" className={`${head} text-left`}>{t.common.player}</th>
              <th scope="col" className={head}>{t.statistics.wins}</th>
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
                <th scope="row" className={`${cell} text-left font-semibold`}>{t.statistics.others}</th>
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
            <Tooltip {...tooltip} cursor={{ fill: 'var(--color-surface-sunken)' }} formatter={(value) => [value, t.statistics.wins]} />
            <Bar dataKey="wins" name={t.statistics.wins} fill={SERIES_COLORS[0]} radius={[0, 4, 4, 0]} isAnimationActive={false}>
              <LabelList dataKey="wins" position="right" fill="var(--color-text)" fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {others > 0 && <p className="mt-2 text-sm text-muted">{t.statistics.othersCount({ count: others })}</p>}
    </Figure>
  )
}

/** "Pote por evento": the pot of each night, or of each season over every season. */
export function PotsChart({ progress, perSeason, className }: { progress: Pick<Statistics['points_progress'], 'steps' | 'pots'>; perSeason: boolean; className?: string }) {
  const points = potsData(progress)
  const top = points.reduce<(typeof points)[number] | undefined>((best, point) => (point.pot > (best?.pot ?? 0) ? point : best), undefined)
  const title = perSeason ? t.statistics.potsPerSeason : t.statistics.potsPerNight
  return (
    <Figure
      bare
      className={className}
      title={title}
      description={t.statistics.potsDescription({ perSeason, top: top && { label: top.label, pot: formatMoney(String(top.pot)) } })}
      table={
        <table className="w-full border-collapse">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr>
              <th scope="col" className={`${head} text-left`}>{perSeason ? t.common.season : t.common.night}</th>
              <th scope="col" className={head}>{t.common.pot}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.label} className="even:bg-surface-stripe">
                <th scope="row" className={`${cell} text-left font-semibold`}>{point.label}</th>
                <td className={cell}>{formatMoney(String(point.pot))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <div className="relative min-h-48 flex-1">
        <ResponsiveContainer width="100%" height="100%" className="absolute inset-0">
          <LineChart data={points} accessibilityLayer={false} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="label" tick={tick} tickLine={false} axisLine={{ stroke: 'var(--color-border)' }} minTickGap={24} />
            <YAxis tick={tick} tickLine={false} axisLine={false} width={48} tickFormatter={formatWhole} />
            <Tooltip {...tooltip} cursor={{ stroke: 'var(--color-muted)' }} formatter={(value) => [formatMoney(String(value)), t.common.pot]} />
            <Line
              dataKey="pot"
              name={t.common.pot}
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

/** "Locais": the share of the nights played at each place. */
export function PlacesChart({ places, className }: { places: Statistics['places']; className?: string }) {
  const slices = placesData(places, t.statistics.others)
  return (
    <Figure
      bare
      className={className}
      title={t.statistics.places}
      description={t.statistics.placesDescription({ top: slices[0] })}
      table={
        <table className="w-full border-collapse">
          <caption className="sr-only">{t.statistics.placesCaption}</caption>
          <thead>
            <tr>
              <th scope="col" className={`${head} text-left`}>{t.common.place}</th>
              <th scope="col" className={head}>{t.common.nights}</th>
            </tr>
          </thead>
          <tbody>
            {places.rows.map((row) => (
              <tr key={row.place!.id} className="even:bg-surface-stripe">
                <th scope="row" className={`${cell} text-left font-semibold wrap-anywhere`}>{row.place!.name}</th>
                <td className={cell}>{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="aspect-square w-40 max-w-full shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart accessibilityLayer={false}>
              <Tooltip {...tooltip} />
              {/* Starts at the top and goes clockwise, biggest first. The stroke is the gap between two slices. */}
              <Pie data={slices} dataKey="count" nameKey="name" startAngle={90} endAngle={-270} outerRadius="100%" stroke="var(--color-surface)" strokeWidth={2} isAnimationActive={false} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Every slice is named here with its number, so none is told by its color alone. */}
        <ul aria-label={t.statistics.legend} className="flex min-w-0 max-w-xs flex-1 basis-40 flex-col gap-1 text-sm">
          {slices.map((slice) => (
            <li key={slice.key} className="flex items-center gap-2">
              <span aria-hidden className="inline-block h-3 w-3 shrink-0 rounded-sm" style={{ background: slice.fill }} />
              <span className="min-w-0 flex-1 wrap-anywhere">{slice.name}</span>
              <span className="font-bold tabular">{slice.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </Figure>
  )
}
