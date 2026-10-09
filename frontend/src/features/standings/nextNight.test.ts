import { describe, expect, it } from 'vitest'
import { nextNight } from './nextNight'

// "Evento aberto" and "Próximo evento" on "Classificação" (docs/specs/seasons-and-nights.md, rule 17c).

const open = { is_finished: false }
const night = (id: number, status: 'finished' | 'open' | 'scheduled') => ({ id, status })

describe('nextNight', () => {
  it('is the open night, even with a scheduled one before it', () => {
    expect(nextNight(open, [night(1, 'finished'), night(2, 'scheduled'), night(3, 'open')])?.id).toBe(3)
  })

  it('is the first scheduled night when none is open', () => {
    expect(nextNight(open, [night(1, 'finished'), night(2, 'scheduled'), night(3, 'scheduled')])?.id).toBe(2)
  })

  it('is none when every night is finished', () => {
    expect(nextNight(open, [night(1, 'finished')])).toBeUndefined()
  })

  it('is none in a finished season, even with a night left open or scheduled', () => {
    const finished = { is_finished: true }
    expect(nextNight(finished, [night(1, 'finished'), night(2, 'open')])).toBeUndefined()
    expect(nextNight(finished, [night(1, 'finished'), night(2, 'scheduled')])).toBeUndefined()
  })
})
