import { describe, expect, it } from 'vitest'
import { brandCss, brandProblems, brandShades, contrast, mix } from './brand'

describe('brand shades', () => {
  it('makes the hover, soft and current-month shades from the main color', () => {
    expect(brandShades('#14532D')).toEqual({
      primary: '#14532d',
      primaryHover: '#0f3f22',
      primarySoft: '#dee7e2',
      surfaceCurrent: '#f3f6f5',
    })
  })

  it('mixes two colors', () => {
    expect(mix('#000000', '#ffffff', 0)).toBe('#000000')
    expect(mix('#000000', '#ffffff', 1)).toBe('#ffffff')
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080')
  })

  it('measures contrast as WCAG does', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
  })

  it('writes the shades as CSS variables', () => {
    expect(brandCss('#14532d')).toContain('--color-primary:#14532d;')
    expect(brandCss('#14532d')).toContain('--color-primary-hover:#0f3f22;')
  })
})

describe('brand color check', () => {
  it.each(['#14532d', '#1e3a8a', '#7f1d1d', '#111827'])('accepts %s, dark enough for light text', (color) => {
    expect(brandProblems(color)).toEqual([])
  })

  it('refuses a color too light for the text on it', () => {
    const problems = brandProblems('#86efac')
    expect(problems.length).toBeGreaterThan(0)
    expect(problems[0]).toContain('Choose a darker color.')
  })

  it.each(['green', '#123', '14532d', '#14532dff'])('refuses %s, which is not #rrggbb', (color) => {
    expect(brandProblems(color)).toEqual([`"${color}" is not a color written as #rrggbb.`])
  })
})
