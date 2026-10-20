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
  'var(--color-chart-9)',
  'var(--color-chart-10)',
]

/** A pie keeps eight colors (docs/decisions/0023-ten-chart-colors.md). */
const PIE_COLORS = SERIES_COLORS.slice(0, 8)

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

/**
 * The leaders' position in each season as chart points, with the same series, keys and colors as
 * {@link progressData}. A season in which a player did not score has no value for them: their line has a gap.
 * The API sends fifteen players: the five after the ten colors are drawn in the text color, never a color of
 * their own, since their small charts are named.
 */
export function rankProgressData(steps: Statistics['points_progress']['steps'], rankProgress: NonNullable<Statistics['rank_progress']>): ProgressData {
  const series = rankProgress.map((s, i) => ({
    key: `p${s.player.id}`,
    nickname: s.player.nickname,
    color: SERIES_COLORS[i] ?? 'var(--color-text)',
  }))
  const points = steps.map((step, i) => {
    const point: ProgressData['points'][number] = { label: step.season_name }
    series.forEach((s, n) => {
      const rank = rankProgress[n].ranks[i]
      if (rank !== null && rank !== undefined) point[s.key] = rank
    })
    return point
  })
  return { series, points }
}

/** The ticks of an axis of positions: 1st always, then about six more down to the worst position shown. */
export function rankTicks(worst: number): number[] {
  const last = Math.max(2, worst)
  const step = Math.ceil((last - 1) / 6)
  return Array.from({ length: Math.floor((last - 1) / step) + 1 }, (_, i) => 1 + i * step)
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

export interface PlayerRankPoint {
  /** The season's name */
  label: string
  /** The position with the season's Main Event counted as one more night */
  rank: number
}

/** One player's position in each season, oldest first: the API lists the seasons newest first. */
export function playerRankData(seasons: PlayerStatistics['seasons']): PlayerRankPoint[] {
  return seasons.map((season) => ({ label: season.season_name, rank: season.rank_with_main_event })).reverse()
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

export interface RebuyPoint {
  label: string
  rebuys: number
  /** Absent on a site with no time chip. */
  timeChips?: number
}

/** The rebuys and the late time chips of each step as chart points, labelled as in {@link progressData}. */
export function rebuysData(progress: Pick<Statistics['points_progress'], 'steps'>, rebuys: Pick<NonNullable<Statistics['rebuys']>, 'rebuys_per_step' | 'time_chips_per_step'>): RebuyPoint[] {
  return progress.steps.map((step, i) => ({
    label: step.starts_at ? formatDate(step.starts_at) : step.season_name,
    rebuys: rebuys.rebuys_per_step[i] ?? 0,
    ...(rebuys.time_chips_per_step ? { timeChips: rebuys.time_chips_per_step[i] ?? 0 } : {}),
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
  if (rows.length <= PIE_COLORS.length) return rows.map((row, i) => ({ ...row, fill: PIE_COLORS[i] }))

  const shown = rows.slice(0, PIE_COLORS.length - 1)
  const rest = rows.slice(shown.length).reduce((sum, row) => sum + row.count, 0)
  return [...shown.map((row, i) => ({ ...row, fill: PIE_COLORS[i] })), { key: 'others', name: others, count: rest, fill: 'var(--color-muted)' }]
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
