import { describe, expect, it } from 'vitest'
import { playerStatistics, playerStatisticsAllTime, statistics, statisticsAllTime } from '@/mocks/data'
import { playerProgressData, positionsData, progressData, winsData } from './chartData'

describe('progressData', () => {
  it('has one point per night in a season, labelled by date', () => {
    const { series, points } = progressData(statistics.points_progress)
    expect(series.map((s) => s.nickname)).toEqual(['Ana', 'Carlão', 'Helena', 'Breno', 'Dudu', 'Estela', 'Fausto', 'Guga'])
    expect(points).toHaveLength(5)
    expect(points[0]).toMatchObject({ label: '03/04/2026', p1: 319.2, p3: 193.2 })
    expect(points[4]).toMatchObject({ label: '29/05/2026', p1: 986.3 })
  })

  it('has one point per season over every season, labelled by season', () => {
    const { points } = progressData(statisticsAllTime.points_progress)
    expect(points.map((p) => p.label)).toEqual(['Liga 2024', 'Liga 2025', 'Liga 2026'])
  })

  it('gives each series its place\'s color', () => {
    const { series } = progressData(statistics.points_progress)
    expect(series.map((s) => s.color)).toEqual([1, 2, 3, 4, 5, 6, 7, 8].map((n) => `var(--color-chart-${n})`))
  })
})

describe('winsData', () => {
  it('takes the bars from the first-place list', () => {
    expect(winsData(statistics)).toEqual([
      { key: 1, nickname: 'Ana', wins: 2 },
      { key: 3, nickname: 'Carlão', wins: 1 },
      { key: 8, nickname: 'Helena', wins: 1 },
      { key: 2, nickname: 'Breno', wins: 1 },
    ])
  })

  it('is empty when nobody won yet', () => {
    expect(winsData({ ...statistics, positions: [] })).toEqual([])
  })
})

describe('playerProgressData', () => {
  it('has one point per night in a season, and stays flat where the player did not score', () => {
    const points = playerProgressData(playerStatistics.points_progress)
    expect(points).toHaveLength(5)
    expect(points.slice(0, 2)).toEqual([{ label: '03/04/2026', points: 319.2 }, { label: '17/04/2026', points: 319.2 }])
  })

  it('has one point per season over every season', () => {
    expect(playerProgressData(playerStatisticsAllTime.points_progress)).toEqual([
      { label: 'Liga 2024', points: 5210.4 },
      { label: 'Liga 2025', points: 9980.1 },
      { label: 'Liga 2026', points: 10966.4 },
    ])
  })
})

describe('positionsData', () => {
  it('has a bar for every scoring position, with the ones never reached at zero', () => {
    expect(positionsData(playerStatistics.positions)).toEqual([
      { label: '1º', count: 2 },
      { label: '2º', count: 1 },
      { label: '3º', count: 0 },
      { label: '4º', count: 1 },
      { label: '5º', count: 0 },
      { label: '6º', count: 0 },
    ])
  })
})
