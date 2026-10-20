import { describe, expect, it } from 'vitest'
import { titlePlaces } from './titlePlaces'

describe('titlePlaces', () => {
  it('gives the next number of titles the next place, after players who share one', () => {
    const rows = [{ id: 1, count: 4 }, { id: 2, count: 2 }, { id: 3, count: 2 }, { id: 4, count: 2 }, { id: 5, count: 1 }, { id: 6, count: 1 }]
    expect(titlePlaces(rows).map((row) => row.rank)).toEqual([1, 2, 2, 2, 3, 3])
  })

  it('has no place for no title', () => {
    expect(titlePlaces([])).toEqual([])
  })
})
