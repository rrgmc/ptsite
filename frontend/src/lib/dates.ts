import { site } from './site'

// Plain calendar dates ("2027-03-26") for month grids. Dates and times from the API are read in the site's time
// zone, whatever the visitor's own.

const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: site.timeZone })
const monthName = new Intl.DateTimeFormat(site.locale, { month: 'long', year: 'numeric', timeZone: 'UTC' })
const clock = new Intl.DateTimeFormat('en-CA', {
  timeZone: site.timeZone, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
})

/** "2027-03-26T21:30:00-03:00" → "2027-03-26", in the site's time zone. A plain date is returned as it is. */
export function dayOf(iso: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : dayFormat.format(new Date(iso))
}

/** Today in the site's time zone, "2026-09-24". */
export function today(): string {
  return dayFormat.format(new Date())
}

/**
 * A day and a time on the site's clock, as the API takes them: "2027-03-26" and "21:30" give
 * "2027-03-26T21:30:00-03:00" in São Paulo. The offset is the time zone's on that day, so summer time is right.
 */
export function zonedDateTime(day: string, time: string): string {
  const asUtc = new Date(`${day}T${time}:00Z`)
  const part = Object.fromEntries(clock.formatToParts(asUtc).map(({ type, value }) => [type, Number(value)]))
  const shown = Date.UTC(part.year, part.month - 1, part.day, part.hour, part.minute, part.second)
  const minutes = Math.round((shown - asUtc.getTime()) / 60_000)
  const pad = (n: number) => String(Math.abs(n)).padStart(2, '0')
  return `${day}T${time}:00${minutes < 0 ? '-' : '+'}${pad(Math.trunc(minutes / 60))}:${pad(minutes % 60)}`
}

/** "2027-03" → "Março de 2027" */
export function monthTitle(month: string): string {
  const text = monthName.format(new Date(`${month}-01T12:00:00Z`))
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** Every month from the first date's to the last date's, as "YYYY-MM". */
export function monthsBetween(first: string, last: string): string[] {
  const months: string[] = []
  let [year, month] = first.slice(0, 7).split('-').map(Number)
  const end = last.slice(0, 7)
  for (;;) {
    const current = `${year}-${String(month).padStart(2, '0')}`
    if (current > end) return months
    months.push(current)
    month += 1
    if (month > 12) { month = 1; year += 1 }
  }
}

/**
 * The weeks of a month for a grid starting on Sunday, as in Brazilian calendars. Days outside the month are null.
 */
export function monthWeeks(month: string): (string | null)[][] {
  const [year, m] = month.split('-').map(Number)
  const first = new Date(Date.UTC(year, m - 1, 1))
  const daysInMonth = new Date(Date.UTC(year, m, 0)).getUTCDate()
  const cells: (string | null)[] = Array(first.getUTCDay()).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(`${month}-${String(d).padStart(2, '0')}`)
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

/** "2027-01-04" plus a number of days, as "YYYY-MM-DD". */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Years touched by a range, for loading holidays. */
export function yearsBetween(first: string, last: string): number[] {
  const years = []
  for (let y = Number(first.slice(0, 4)); y <= Number(last.slice(0, 4)); y++) years.push(y)
  return years
}
