import type { PlayerStatistics, Statistics } from '@/api/client'
import { formatDate, ordinal } from '@/lib/format'

/** The chart colors, in a fixed order: a series keeps its place's color. Tokens only (tokens.css). */
export const SERIES_COLORS = [
  'var(--color-chart-1)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
  'var(--color-chart-5)',
  'var(--color-chart-6)',
  'var(--color-chart-7)',
  'var(--color-chart-8)',
]

export interface ProgressSeries {
  /** The key of this series in each point: "p12". */
  key: string
  nickname: string
  color: string
}

export interface ProgressData {
  series: ProgressSeries[]
  /** One point per step: its label and each series' total after it. */
  points: ({ label: string } & Record<string, string | number>)[]
}

/** The running totals as chart points: a step is a night ("06/03/2026") or, over every season, a season. */
export function progressData(progress: Pick<Statistics['points_progress'], 'steps' | 'series'>): ProgressData {
  const series = progress.series.slice(0, SERIES_COLORS.length).map((s, i) => ({
    key: `p${s.player.id}`,
    nickname: s.player.nickname,
    color: SERIES_COLORS[i],
  }))
  const points = progress.steps.map((step, i) => {
    const point: ProgressData['points'][number] = { label: step.starts_at ? formatDate(step.starts_at) : step.season_name }
    series.forEach((s, n) => {
      point[s.key] = Number(progress.series[n].points[i])
    })
    return point
  })
  return { series, points }
}

export interface PlayerProgressPoint {
  label: string
  points: number
}

/** One player's running total as chart points, labelled as in {@link progressData}. */
export function playerProgressData(progress: PlayerStatistics['points_progress']): PlayerProgressPoint[] {
  return progress.steps.map((step, i) => ({
    label: step.starts_at ? formatDate(step.starts_at) : step.season_name,
    points: Number(progress.points[i]),
  }))
}

export interface PositionBar {
  /** "1º" */
  label: string
  count: number
}

/** How often one player finished in each scoring position, as bars, first place first. */
export function positionsData(positions: PlayerStatistics['positions']): PositionBar[] {
  return positions.map((p) => ({ label: ordinal(p.position), count: p.count }))
}

export interface PotPoint {
  label: string
  pot: number
}

/** The pot of each step as chart points, labelled as in {@link progressData}. */
export function potsData(progress: Pick<Statistics['points_progress'], 'steps' | 'pots'>): PotPoint[] {
  return progress.steps.map((step, i) => ({
    label: step.starts_at ? formatDate(step.starts_at) : step.season_name,
    pot: Number(progress.pots[i]),
  }))
}

export interface PlaceSlice {
  key: number | 'others'
  name: string
  count: number
  /** The slice's color: recharts reads it from here. */
  fill: string
}

/**
 * "Locais" as the slices of a pie, most nights first. A pie has eight colors: with more places, the ones
 * after the seventh are added up as one last slice, named by `others`, in the muted color.
 */
export function placesData(places: Statistics['places'], others: string): PlaceSlice[] {
  const rows = places.rows.map((row) => ({ key: row.place!.id, name: row.place!.name, count: row.count ?? 0 }))
  if (rows.length <= SERIES_COLORS.length) return rows.map((row, i) => ({ ...row, fill: SERIES_COLORS[i] }))

  const shown = rows.slice(0, SERIES_COLORS.length - 1)
  const rest = rows.slice(shown.length).reduce((sum, row) => sum + row.count, 0)
  return [...shown.map((row, i) => ({ ...row, fill: SERIES_COLORS[i] })), { key: 'others', name: others, count: rest, fill: 'var(--color-muted)' }]
}

export interface WinsBar {
  key: number
  nickname: string
  wins: number
}

/** The "Posição: 1º" list as bars, most wins first. */
export function winsData(statistics: Statistics): WinsBar[] {
  const first = statistics.positions.find((list) => list.position === 1)
  return (first?.rows ?? []).map((row) => ({ key: row.player!.id, nickname: row.player!.nickname, wins: row.count ?? 0 }))
}
