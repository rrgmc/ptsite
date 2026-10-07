// The shades made from a site's main color, and the check that text can be read on them. Plain functions with
// no browser API: the build uses them (site-settings.ts) and so do the tests.

type Rgb = [number, number, number]

/** The colors the brand shades are read against (src/tokens/tokens.css). */
const CANVAS = '#f4f3ef'
const SURFACE = '#ffffff'
const ON_PRIMARY = '#fbfaf7'

/** WCAG 2.2 AA for normal text. */
const MINIMUM_CONTRAST = 4.5

export function isHexColor(color: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(color)
}

function toRgb(color: string): Rgb {
  return [1, 3, 5].map((at) => parseInt(color.slice(at, at + 2), 16)) as Rgb
}

function toHex(rgb: Rgb): string {
  return `#${rgb.map((part) => Math.round(part).toString(16).padStart(2, '0')).join('')}`
}

/** `amount` of `other` mixed into `color`: 0 gives `color`, 1 gives `other`. */
export function mix(color: string, other: string, amount: number): string {
  const [a, b] = [toRgb(color), toRgb(other)]
  return toHex(a.map((part, i) => part + (b[i] - part) * amount) as Rgb)
}

function luminance(color: string): number {
  const [r, g, b] = toRgb(color).map((part) => {
    const share = part / 255
    return share <= 0.03928 ? share / 12.92 : ((share + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** The WCAG contrast ratio of two colors, from 1 to 21. */
export function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

export interface BrandShades {
  primary: string
  primaryHover: string
  primarySoft: string
  surfaceCurrent: string
}

/** The four brand tokens of tokens.css, from the main color alone. */
export function brandShades(brandColor: string): BrandShades {
  return {
    primary: brandColor.toLowerCase(),
    primaryHover: mix(brandColor, '#000000', 0.24),
    primarySoft: mix(brandColor, '#ffffff', 0.86),
    surfaceCurrent: mix(brandColor, '#ffffff', 0.95),
  }
}

/**
 * What stops a main color from being used: it is the background of buttons with light text, and the color of
 * links and headings on the page, on a card and on a soft background. Empty: the color is fine.
 */
export function brandProblems(brandColor: string): string[] {
  if (!isHexColor(brandColor)) return [`"${brandColor}" is not a color written as #rrggbb.`]
  const { primarySoft } = brandShades(brandColor)
  const pairs: [string, string][] = [
    ['light text on it', ON_PRIMARY],
    ['it as text on the page', CANVAS],
    ['it as text on a card', SURFACE],
    ['it as text on its own soft shade', primarySoft],
  ]
  return pairs
    .map(([what, other]) => ({ what, ratio: contrast(brandColor, other) }))
    .filter(({ ratio }) => ratio < MINIMUM_CONTRAST)
    .map(({ what, ratio }) => `${what} has a contrast of ${ratio.toFixed(2)}, below ${MINIMUM_CONTRAST}. Choose a darker color.`)
}

/** The CSS that puts the shades over the defaults of tokens.css. */
export function brandCss(brandColor: string): string {
  const shades = brandShades(brandColor)
  return `:root{--color-primary:${shades.primary};--color-primary-hover:${shades.primaryHover};--color-primary-soft:${shades.primarySoft};--color-surface-current:${shades.surfaceCurrent}}`
}
