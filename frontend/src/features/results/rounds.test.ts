import { expect, it } from 'vitest'
import { numberRounds } from './rounds'

const night = (id: number, status: 'scheduled' | 'open' | 'finished', is_extra = false) => ({ id, status, is_extra })

it('numbers the finished rounds in order', () => {
  const numbered = numberRounds([night(1, 'finished'), night(2, 'finished'), night(3, 'open'), night(4, 'scheduled')])

  expect(numbered.map(({ night, number }) => [night.id, number])).toEqual([[1, 1], [2, 2]])
})

it('gives no number to an extra night or a Main Event night, and does not count them', () => {
  const numbered = numberRounds([night(1, 'finished'), night(2, 'finished', true), night(3, 'finished', true), night(4, 'finished')])

  expect(numbered.map(({ night, number }) => [night.id, number])).toEqual([[1, 1], [2, undefined], [3, undefined], [4, 2]])
})
