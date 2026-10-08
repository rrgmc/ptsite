import { describe, expect, it } from 'vitest'
import { formatDate, formatLongDate, formatMoney, fullNameIfDifferent, nightTitle, parseMoneyInput, parseSignedMoneyInput, shareOf, titleOfNight } from './format'

describe('format', () => {
  it('formats money in reais', () => {
    expect(formatMoney('840.00')).toBe('R$ 840,00')
  })

  it('shows a date alone on its own day, not the day before', () => {
    expect(formatDate('2026-04-01')).toBe('01/04/2026')
    expect(formatLongDate('2027-03-26')).toBe('Sexta-feira, 26/03/2027')
    expect(formatLongDate('2027-03-26T21:30:00-03:00')).toBe('Sexta-feira, 26/03/2027')
  })

  it('titles nights by their date, with their number in the season when it is known', () => {
    expect(nightTitle('2026-03-14T21:00:00-03:00')).toBe('Liga - 14/03/2026')
    expect(nightTitle('2026-03-14T21:00:00-03:00', 3)).toBe('Liga 3 - 14/03/2026')
  })

  it('titles a Main Event night as the Main Event, and any other night as before', () => {
    expect(titleOfNight({ starts_at: '2026-12-12T13:00:00-03:00', type: 'main_event' })).toBe('Main Event - 12/12/2026')
    expect(titleOfNight({ starts_at: '2026-03-14T21:00:00-03:00', type: 'regular' }, 3)).toBe('Liga 3 - 14/03/2026')
  })

  it('parses Brazilian money input', () => {
    expect(parseMoneyInput('840')).toBe('840.00')
    expect(parseMoneyInput('1.234,5')).toBe('1234.50')
    expect(parseMoneyInput('R$ 845,00')).toBe('845.00')
    expect(parseMoneyInput('abc')).toBeNull()
  })

  it('parses an amount that may be negative', () => {
    expect(parseSignedMoneyInput('-5')).toBe('-5.00')
    expect(parseSignedMoneyInput(' −1.234,5 ')).toBe('-1234.50')
    expect(parseSignedMoneyInput('20,00')).toBe('20.00')
    expect(parseSignedMoneyInput('-0')).toBe('0.00')
    expect(parseSignedMoneyInput('--5')).toBeNull()
    expect(parseSignedMoneyInput('-')).toBeNull()
  })

  it('matches the backend points calculation', () => {
    expect(shareOf('845.00', 38)).toBe('321.10')
    expect(shareOf('0.50', 5)).toBe('0.03')
  })

  it('leaves out a full name that only repeats the nickname', () => {
    expect(fullNameIfDifferent('breno', 'Breno')).toBeNull()
    expect(fullNameIfDifferent('Zé', 'ze')).toBeNull()
    expect(fullNameIfDifferent('Zé', 'Zeferino Augusto Prado')).toBe('Zeferino Augusto Prado')
    expect(fullNameIfDifferent('Lia', null)).toBeNull()
  })
})
