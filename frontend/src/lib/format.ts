import { site } from './site'

// Brazilian Portuguese formatting for money, dates and ordinals.

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const points = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const weekdayDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', timeZone: 'America/Sao_Paulo' })
const shortDate = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' })
const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })

/**
 * A date and time from the API. A date alone ("2026-04-01") is read as midday in São Paulo: as UTC midnight it
 * would show the day before.
 */
function toDate(iso: string): Date {
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00-03:00` : iso)
}

/** "840.00" → "R$ 840,00" */
export function formatMoney(amount: string | null | undefined): string {
  return amount == null ? '—' : money.format(Number(amount))
}

/** "114.00" → "114,00" */
export function formatPoints(amount: string | number): string {
  return points.format(Number(amount))
}

/** ISO date → "14/03/2026" */
export function formatDate(iso: string): string {
  return shortDate.format(toDate(iso))
}

/** ISO date → "Sábado, 14/03" (only the first letter capitalized: "Sexta-feira", not "Sexta-Feira") */
export function formatWeekday(iso: string): string {
  const text = weekdayDate.format(toDate(iso))
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** ISO date → "Sexta-feira, 26/03/2027" */
export function formatLongDate(iso: string): string {
  return `${formatWeekday(iso)}/${toDate(iso).toLocaleString('pt-BR', { year: 'numeric', timeZone: 'America/Sao_Paulo' })}`
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

/** 1 → "1º" */
export function ordinal(position: number): string {
  return `${position}º`
}

/** Brazilian decimal input ("1.234,50" or "840") → API decimal string ("1234.50"), or null if invalid. */
export function parseMoneyInput(text: string): string | null {
  const cleaned = text.replace(/\s|R\$/g, '').replace(/\./g, '').replace(',', '.')
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(cleaned)) return null
  return Number(cleaned).toFixed(2)
}

/** Points share for display in the simulator and results form: pot × percent ÷ 100, rounded half up. */
export function shareOf(pot: string, percent: number): string {
  const cents = Math.round(Number(pot) * 100)
  return (Math.floor((cents * percent + 50) / 100) / 100).toFixed(2)
}

/** A player's full name, unless it only repeats the nickname ("breno" / "Breno"), so lists don't show it twice. */
export function fullNameIfDifferent(nickname: string, name: string | null | undefined): string | null {
  if (!name) return null
  return name.localeCompare(nickname, 'pt-BR', { sensitivity: 'base' }) === 0 ? null : name
}
