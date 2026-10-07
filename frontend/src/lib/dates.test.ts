import { describe, expect, it } from 'vitest'
import { dayOf, monthsBetween, monthTitle, monthWeeks } from './dates'

describe('dates', () => {
  it('reads API times in São Paulo', () => {
    expect(dayOf('2027-03-26T21:30:00-03:00')).toBe('2027-03-26')
    expect(dayOf('2027-03-26T23:30:00-03:00')).toBe('2027-03-26')
    expect(dayOf('2027-03-26')).toBe('2027-03-26')
  })

  it('names months in Brazilian Portuguese', () => {
    expect(monthTitle('2027-03')).toBe('Março de 2027')
  })

  it('lists the months of a range, across years', () => {
    expect(monthsBetween('2026-11-20', '2027-02-05')).toEqual(['2026-11', '2026-12', '2027-01', '2027-02'])
  })

  it('lays out a month starting on Sunday', () => {
    const weeks = monthWeeks('2027-05') // 01/05/2027 is a Saturday
    expect(weeks[0]).toEqual([null, null, null, null, null, null, '2027-05-01'])
    expect(weeks.at(-1)).toEqual(['2027-05-30', '2027-05-31', null, null, null, null, null])
  })
})

describe('addDays', () => {
  it('crosses months and years', async () => {
    const { addDays } = await import('./dates')
    expect(addDays('2027-12-20', 15)).toBe('2028-01-04')
  })
})
