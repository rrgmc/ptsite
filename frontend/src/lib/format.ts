import { t } from '@/i18n'
import { currencySymbol, site } from './site'

// Money, dates and ordinals in the site's language, money and time zone (site.locale, site.currency,
// site.timeZone). The examples below are the demo site's: Brazilian Portuguese, reais, São Paulo.

const { locale, timeZone } = site
const money = new Intl.NumberFormat(locale, { style: 'currency', currency: site.currency })
const points = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const weekdayDate = new Intl.DateTimeFormat(locale, { weekday: 'long', day: '2-digit', month: '2-digit', timeZone })
const longDate = new Intl.DateTimeFormat(locale, { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone })
const shortDate = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone })
const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', timeZone })
const whole = new Intl.NumberFormat(locale)

// The characters the site's language puts between thousands and before the cents: "." and "," in pt-BR.
const numberParts = new Intl.NumberFormat(locale).formatToParts(1234567.8)
const groupSeparator = numberParts.find((part) => part.type === 'group')?.value ?? ''
const decimalSeparator = numberParts.find((part) => part.type === 'decimal')?.value ?? '.'

/**
 * A date and time from the API. A date alone ("2026-04-01") is read as midday UTC: as midnight it would show
 * the day before in a time zone west of Greenwich.
 */
function toDate(iso: string): Date {
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00Z` : iso)
}

function capitalized(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** "840.00" → "R$ 840,00" */
export function formatMoney(amount: string | null | undefined): string {
  return amount == null ? '—' : money.format(Number(amount))
}

/** "114.00" → "114,00" */
export function formatPoints(amount: string | number): string {
  return points.format(Number(amount))
}

/** 1500 → "1.500", for the scale of a chart */
export function formatWhole(amount: number): string {
  return whole.format(amount)
}

/** ISO date → "14/03/2026" */
export function formatDate(iso: string): string {
  return shortDate.format(toDate(iso))
}

/** ISO date → "Sábado, 14/03" (only the first letter capitalized: "Sexta-feira", not "Sexta-Feira") */
export function formatWeekday(iso: string): string {
  return capitalized(weekdayDate.format(toDate(iso)))
}

/** ISO date → "Sexta-feira, 26/03/2027" */
export function formatLongDate(iso: string): string {
  return capitalized(longDate.format(toDate(iso)))
}

export function formatTime(iso: string): string {
  return time.format(toDate(iso))
}

/**
 * The title of a night: "Liga - 14/03/2026", or "Liga 3 - 14/03/2026" with its number in the season. The first
 * word is the site's (site.nightTitlePrefix).
 */
export function nightTitle(iso: string, number?: number): string {
  return `${site.nightTitlePrefix}${number ? ` ${number}` : ''} - ${formatDate(iso)}`
}

/**
 * The title of a night, from the night: "Main Event - 12/12/2026" for a Main Event night, and the title above for
 * any other. Only a round has a number.
 */
export function titleOfNight(night: { starts_at: string; type?: 'regular' | 'main_event' }, number?: number): string {
  return night.type === 'main_event' ? `${t.nights.mainEventTitlePrefix} - ${formatDate(night.starts_at)}` : nightTitle(night.starts_at, number)
}

/** 1 → "1º", or "1st" in English */
export function ordinal(position: number): string {
  return t.common.ordinal({ position })
}

/**
 * An amount as typed, in the site's language ("1.234,50" or "840" in pt-BR, with or without the money sign) →
 * API decimal string ("1234.50"), or null if invalid.
 */
export function parseMoneyInput(text: string): string | null {
  const cleaned = text
    .replace(/\s/g, '')
    .split(currencySymbol).join('')
    .split(groupSeparator || '\u0000').join('')
    .replace(decimalSeparator, '.')
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(cleaned)) return null
  return Number(cleaned).toFixed(2)
}

/** As parseMoneyInput, for an amount that may be negative: "-5,00" → "-5.00". */
export function parseSignedMoneyInput(text: string): string | null {
  const trimmed = text.trim()
  const isNegative = /^[-−]/.test(trimmed)
  const amount = parseMoneyInput(isNegative ? trimmed.slice(1) : trimmed)
  return amount !== null && isNegative && Number(amount) !== 0 ? `-${amount}` : amount
}

/**
 * An API decimal string as typed in a money field, in the site's language: "840.00" → "840,00" in pt-BR. Nothing
 * when the amount is not known. parseMoneyInput reads it back.
 */
export function moneyText(amount: string | null | undefined): string {
  return amount ? amount.replace('.', decimalSeparator) : ''
}

/** Points share for display in the simulator and results form: pot × percent ÷ 100, rounded half up. */
export function shareOf(pot: string, percent: number): string {
  const cents = Math.round(Number(pot) * 100)
  return (Math.floor((cents * percent + 50) / 100) / 100).toFixed(2)
}

/** A player's full name, unless it only repeats the nickname ("breno" / "Breno"), so lists don't show it twice. */
export function fullNameIfDifferent(nickname: string, name: string | null | undefined): string | null {
  if (!name) return null
  return name.localeCompare(nickname, locale, { sensitivity: 'base' }) === 0 ? null : name
}
