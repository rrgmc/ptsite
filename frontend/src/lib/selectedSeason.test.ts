import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSelectedSeasonId, setSelectedSeasonId } from './selectedSeason'

describe('selectedSeason', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    setSelectedSeasonId(null)
  })

  it('has no pick at first, which means the current season', () => {
    expect(getSelectedSeasonId()).toBeNull()
  })

  it('keeps the pick in the session storage', () => {
    setSelectedSeasonId(7)
    expect(getSelectedSeasonId()).toBe(7)
    expect(Object.values({ ...sessionStorage })).toEqual(['7'])
  })

  it('removes the pick', () => {
    setSelectedSeasonId(7)
    setSelectedSeasonId(null)
    expect(getSelectedSeasonId()).toBeNull()
    expect(sessionStorage.length).toBe(0)
  })

  it('ignores a stored value that is not a season id', () => {
    setSelectedSeasonId(7)
    sessionStorage.setItem(sessionStorage.key(0)!, 'abc')
    expect(getSelectedSeasonId()).toBeNull()
  })

  // Last: after a refusal the store stops using the session storage.
  it('keeps the pick in memory when the browser refuses the session storage', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    setSelectedSeasonId(3)
    expect(getSelectedSeasonId()).toBe(3)
  })
})
