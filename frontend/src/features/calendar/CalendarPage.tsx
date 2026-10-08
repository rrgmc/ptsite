import type { ReactNode } from 'react'
import { Button } from 'react-aria-components'
import { Link, useSearchParams } from 'react-router'
import type { CalendarEntry, CalendarHoliday, Season } from '@/api/client'
import { useHolidayCalendars, useSeasonCalendar } from '@/api/queries'
import { PageHeader } from '@/components/Card'
import { Empty, ErrorBox, Loading } from '@/components/Feedback'
import { type GridDay, GridLegend, MonthGrid, type MonthNote, MonthNotes } from '@/components/MonthGrid'
import { t } from '@/i18n'
import { dayOf, monthsBetween, today, yearsBetween } from '@/lib/dates'
import { formatMoney, formatTime, formatWeekday } from '@/lib/format'
import { useSeasonPath } from '@/lib/seasonPath'
import { useSelectedSeason } from '../layout/useSelectedSeason'

/** "Calendário": the season's nights on month calendars, for everyone. */
export function CalendarPage() {
  const { season, isPending, error } = useSelectedSeason()
  const calendar = useSeasonCalendar(season?.id)
  const last = calendar.data?.at(-1)?.starts_at
  const holidays = useHolidayCalendars(season && last ? yearsBetween(season.starts_on, dayOf(last)) : [])
  const [params] = useSearchParams()

  if (isPending) return <Loading />
  if (error) return <ErrorBox error={error} />
  if (!season) return <Empty>{t.calendar.noSeason}</Empty>

  return (
    <>
      <PageHeader title={t.calendar.title} subtitle={season.name} />
      {calendar.isPending || holidays.isPending ? <Loading /> : calendar.error ? <ErrorBox error={calendar.error} /> : (
        <SeasonCalendar season={season} entries={calendar.data!} holidays={holidays.data} showAll={params.get('view') === 'all'} />
      )}
    </>
  )
}

const answers = { all_in: t.attendance.allIn, fold: t.attendance.fold } as const

function describe(entry: CalendarEntry): string {
  const n = entry.night
  if (!n) {
    const reason = entry.skip_reason!
    return t.calendar.noNight({
      reason: reason.kind === 'carnival'
        ? t.calendar.carnival
        : reason.kind === 'bridge'
          ? t.calendar.bridgeNamed({ name: reason.holiday ?? '' })
          : t.calendar.holidayNamed({ name: reason.holiday ?? '' }),
    })
  }
  const mark = n.type === 'main_event' ? t.nights.marks.mainEvent : n.is_extra ? t.nights.marks.extra : null
  // A Main Event has a champion and no pot.
  if (n.status === 'finished') return [mark, `🏆 ${n.winner ?? '—'}`, n.type === 'main_event' ? null : formatMoney(n.pot)].filter(Boolean).join(' · ')
  return [
    mark,
    formatTime(entry.starts_at),
    n.status === 'open' ? t.calendar.open : null,
    n.place ?? t.calendar.placeToBeSet,
    n.status === 'open' || n.all_in_count > 0 ? t.calendar.allInCount({ count: n.all_in_count }) : null,
    n.my_answer ? t.calendar.yourAnswer({ answer: answers[n.my_answer] }) : null,
  ].filter(Boolean).join(' · ')
}

export function SeasonCalendar({ season, entries, holidays = [], showAll = false, today: now = today() }: {
  season: Season
  entries: CalendarEntry[]
  holidays?: CalendarHoliday[]
  /** Every month of the season, not only this month and the next. */
  showAll?: boolean
  /** "2027-03-05". Today in São Paulo unless given (stories and tests). */
  today?: string
}) {
  const to = useSeasonPath()
  const next = entries.find((e) => e.night && e.night.status !== 'finished' && dayOf(e.starts_at) >= now)

  if (entries.length === 0) return <Empty>{t.calendar.noNights}</Empty>

  const days: Record<string, GridDay> = {}
  for (const h of holidays) {
    if (!h.cancelled) days[h.date] = { tone: 'holiday', label: t.calendar.holidayNamed({ name: h.name }) }
  }
  for (const e of entries) {
    const day = dayOf(e.starts_at)
    if (!e.night) {
      days[day] = { tone: 'skipped', label: describe(e) }
      continue
    }
    // A day can have an extra night beside another one. The day names both and opens the first; the notes under
    // the month link to each.
    const other = days[day]?.href ? days[day] : undefined
    days[day] = {
      tone: e.night.status === 'finished' && (!other || other.tone === 'finished') ? 'finished' : 'night',
      label: other ? `${other.label} + ${describe(e)}` : describe(e),
      href: other?.href ?? `/nights/${e.night.id}`,
      highlight: e === next || other?.highlight,
    }
  }
  const first = [season.starts_on, dayOf(entries[0].starts_at)].sort()[0]
  const last = dayOf(entries.at(-1)!.starts_at)
  const months = monthsBetween(first, last)
  // The page shows this month and the next one. A season that does not include today has no such months, so it
  // shows them all.
  const at = months.indexOf(now.slice(0, 7))
  const current = at < 0 ? months : months.slice(at, at + 2)
  const canNarrow = current.length < months.length
  const shown = showAll ? months : current
  // The page opens at the top. A button goes to the next night's month, or to today's when nothing is coming.
  // The first month is already at the top, and a month not shown is no target.
  const jumpTo = (next ? dayOf(next.starts_at) : now).slice(0, 7)
  const canJump = shown.indexOf(jumpTo) > 0

  return (
    <div className="flex flex-col gap-4">
      {next && (
        <div className="flex flex-col items-start gap-1 rounded-lg bg-primary-soft p-3">
          <p>
            <span className="font-semibold">{t.calendar.nextNight} </span>
            <Link to={`/nights/${next.night!.id}`} className="text-primary underline">{formatWeekday(next.starts_at)}</Link>
            {' · '}{describe(next)}
          </p>
          {canJump && <JumpButton month={jumpTo}>{t.calendar.viewInCalendar}</JumpButton>}
        </div>
      )}
      {!next && canJump && <JumpButton month={jumpTo}>{t.calendar.goToToday}</JumpButton>}
      <GridLegend today={shown.includes(now.slice(0, 7))} items={[
        { tone: 'night', label: t.calendar.legend.night },
        { tone: 'finished', label: t.calendar.legend.finished },
        { tone: 'skipped', label: t.calendar.legend.skipped },
        { tone: 'holiday', label: t.calendar.legend.holiday },
      ]} />
      {canNarrow && (
        <Link to={showAll ? to('/calendar') : `${to('/calendar')}?view=all`} className="self-start font-semibold text-primary underline">
          {showAll ? t.calendar.viewCurrent : t.calendar.viewAll}
        </Link>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shown.map((month) => (
          <MonthGrid key={month} month={month} days={days} today={now} isDisabled={(d) => d < season.starts_on}>
            <MonthNotes notes={calendarNotes(month, entries, holidays)} />
          </MonthGrid>
        ))}
      </div>
    </div>
  )
}

/** Scrolls to a month's grid and moves the focus to its title, so the keyboard and screen readers follow. */
function JumpButton({ month, children }: { month: string; children: ReactNode }) {
  const jump = () => {
    const title = document.getElementById(`month-${month}`)
    if (!title) return
    title.focus({ preventScroll: true })
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    title.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' })
  }
  return (
    <Button
      onPress={jump}
      className="self-start rounded-md font-semibold text-primary underline focus-visible:outline-3 focus-visible:outline-focus focus-visible:outline-offset-2"
    >
      {children}
    </Button>
  )
}

/** The month's nights, the Fridays with no night, and every holiday of the month, in words. */
function calendarNotes(month: string, entries: CalendarEntry[], holidays: CalendarHoliday[]): MonthNote[] {
  // One note per night, so a day with two nights has two.
  const notes = new Map<string, MonthNote>()
  for (const h of holidays) {
    if (!h.cancelled && h.date.startsWith(month)) {
      notes.set(h.date, { date: h.date, tone: 'holiday', text: t.calendar.holidayNamed({ name: h.name }) })
    }
  }
  for (const e of entries) {
    const day = dayOf(e.starts_at)
    if (!day.startsWith(month)) continue
    notes.set(e.night ? `${day}-${e.night.id}` : day, e.night
      ? { date: day, tone: e.night.status === 'finished' ? 'finished' : 'night', text: describe(e), href: `/nights/${e.night.id}` }
      : { date: day, tone: 'skipped', text: describe(e) })
  }
  return [...notes.values()]
}
