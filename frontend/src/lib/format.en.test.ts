import { describe, expect, it, vi } from 'vitest'

// The same functions on a site in English, which writes "1,234.50" where the demo site writes "1.234,50".
vi.mock('./site', async (original) => {
  const actual = await original<typeof import('./site')>()
  return { ...actual, site: { ...actual.site, locale: 'en-US' } }
})

const { moneyText, parseMoneyInput } = await import('./format')

describe('format, on a site in English', () => {
  it('parses money input with a decimal point', () => {
    expect(parseMoneyInput('1,234.5')).toBe('1234.50')
    expect(parseMoneyInput('R$845.00')).toBe('845.00')
  })

  it('fills a money field with the amount as the site writes it, so that it is read back the same', () => {
    expect(moneyText('125.00')).toBe('125.00')
    expect(parseMoneyInput(moneyText('125.00'))).toBe('125.00')
    expect(moneyText(null)).toBe('')
  })
})
