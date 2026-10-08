import { describe, expect, it } from 'vitest'
import { isSeasonScreen, seasonPath, splitSeasonPath } from './seasonPath'

describe('splitSeasonPath', () => {
  it('reads the season and the screen from a season address', () => {
    expect(splitSeasonPath('/seasons/7/results')).toEqual({ seasonId: 7, screen: '/results' })
    expect(splitSeasonPath('/seasons/7/players/12')).toEqual({ seasonId: 7, screen: '/players/12' })
  })

  it('reads the standings from a season address with no screen', () => {
    expect(splitSeasonPath('/seasons/7')).toEqual({ seasonId: 7, screen: '/' })
    expect(splitSeasonPath('/seasons/7/')).toEqual({ seasonId: 7, screen: '/' })
  })

  it('finds no season in any other address', () => {
    expect(splitSeasonPath('/results')).toEqual({ seasonId: null, screen: '/results' })
    expect(splitSeasonPath('/seasons')).toEqual({ seasonId: null, screen: '/seasons' })
    expect(splitSeasonPath('/seasons/select')).toEqual({ seasonId: null, screen: '/seasons/select' })
  })
})

describe('seasonPath', () => {
  it('puts the season before the screen', () => {
    expect(seasonPath(7, '/results')).toBe('/seasons/7/results')
    expect(seasonPath(7, '/')).toBe('/seasons/7')
  })

  it('leaves the address of the current season as it is', () => {
    expect(seasonPath(null, '/results')).toBe('/results')
    expect(seasonPath(null, '/')).toBe('/')
  })

  it('gives back what splitSeasonPath took apart', () => {
    for (const path of ['/seasons/7', '/seasons/7/calendar', '/simulator', '/']) {
      const { seasonId, screen } = splitSeasonPath(path)
      expect(seasonPath(seasonId, screen)).toBe(path)
    }
  })
})

describe('isSeasonScreen', () => {
  it('is true for a season screen, with or without a season in the address', () => {
    for (const path of ['/', '/results', '/players/12', '/seasons/7', '/seasons/7/results', '/seasons/7/players/12']) {
      expect(isSeasonScreen(path), path).toBe(true)
    }
  })

  it('is false for a screen that shows no season', () => {
    for (const path of ['/players', '/players/12/all', '/statistics/all', '/seasons', '/seasons/select', '/nights/3', '/profile', '/admin', undefined]) {
      expect(isSeasonScreen(path), String(path)).toBe(false)
    }
  })
})
