import type { ReactNode } from 'react'
import { Button } from 'react-aria-components'
import { Link } from 'react-router'
import type { CalendarEntry, CalendarHoliday, Season } from '@/api/client'
import { useHolidayCalendars, useSeasonCalendar } from '@/api/queries'
import { PageHeader } from '@/components/Card'
import { Empty, ErrorBox, Loading } from '@/components/Feedback'
import { type GridDay, GridLegend, MonthGrid, type MonthNote, MonthNotes } from '@/components/MonthGrid'
import { dayOf, monthsBetween, today, yearsBetween } from '@/lib/dates'
import { formatMoney, formatTime, formatWeekday } from '@/lib/format'
import { useSelectedSeason } from '../layout/useSelectedSeason'

/** "Calendário": the season's nights on month calendars, for everyone. */
export function CalendarPage() {
  const { season, isPending, error } = useSelectedSeason()
  const calendar = useSeasonCalendar(season?.id)
  const last = calendar.data?.at(-1)?.starts_at
  const holidays = useHolidayCalendars(season && last ? yearsBetween(season.starts_on, dayOf(last)) : [])

  if (isPending) return <Loading />
  if (error) return <ErrorBox error={error} />
  if (!season) return <Empty>Nenhuma temporada cadastrada.</Empty>

  return (
    <>
      <PageHeader title="Calendário" subtitle={season.name} />
      {calendar.isPending || holidays.isPending ? <Loading /> : calendar.error ? <ErrorBox error={calendar.error} /> : (
        <SeasonCalendar season={season} entries={calendar.data!} holidays={holidays.data} />
      )}
    </>
  )
}

const answers = { all_in: 'ALL IN', fold: 'FOLD' } as const

function describe(entry: CalendarEntry): string {
  const n = entry.night
  if (!n) {
    const reason = entry.skip_reason!
    return `Sem evento · ${reason.kind === 'carnival' ? 'Carnaval' : `${reason.kind === 'bridge' ? 'Emenda' : 'Feriado'}: ${reason.holiday}`}`
  }
  if (n.status === 'finished') return `🏆 ${n.winner ?? '—'} · ${formatMoney(n.pot)}`
  return [
    formatTime(entry.starts_at),
    n.status === 'open' ? 'Aberto' : null,
    n.place ?? 'Local a definir',
    n.status === 'open' || n.all_in_count > 0 ? `${n.all_in_count} ALL IN` : null,
    n.my_answer ? `Você: ${answers[n.my_answer]}` : null,
  ].filter(Boolean).join(' · ')
}

export function SeasonCalendar({ season, entries, holidays = [], today: now = today() }: {
  season: Season
  entries: CalendarEntry[]
  holidays?: CalendarHoliday[]
  /** "2027-03-05". Today in São Paulo unless given (stories and tests). */
  today?: string
}) {
  const next = entries.find((e) => e.night && e.night.status !== 'finished' && dayOf(e.starts_at) >= now)

  if (entries.length === 0) return <Empty>Nenhum evento nesta temporada ainda.</Empty>

  const days: Record<string, GridDay> = {}
  for (const h of holidays) {
    if (!h.cancelled) days[h.date] = { tone: 'holiday', label: `Feriado: ${h.name}` }
  }
  for (const e of entries) {
    const day = dayOf(e.starts_at)
    days[day] = e.night
      ? {
          tone: e.night.status === 'finished' ? 'finished' : 'night',
          label: describe(e),
          href: `/nights/${e.night.id}`,
          highlight: e === next,
        }
      : { tone: 'skipped', label: describe(e) }
  }
  const first = [season.starts_on, dayOf(entries[0].starts_at)].sort()[0]
  const last = dayOf(entries.at(-1)!.starts_at)
  const months = monthsBetween(first, last)
  // The page opens at the top. A button goes to the next night's month, or to today's when nothing is coming.
  // The first month is already at the top, and a month not shown is no target.
  const jumpTo = (next ? dayOf(next.starts_at) : now).slice(0, 7)
  const canJump = months.indexOf(jumpTo) > 0

  return (
    <div className="flex flex-col gap-4">
      {next && (
        <div className="flex flex-col items-start gap-1 rounded-lg bg-primary-soft p-3">
          <p>
            <span className="font-semibold">Próximo evento: </span>
            <Link to={`/nights/${next.night!.id}`} className="text-primary underline">{formatWeekday(next.starts_at)}</Link>
            {' · '}{describe(next)}
          </p>
          {canJump && <JumpButton month={jumpTo}>Ver no calendário</JumpButton>}
        </div>
      )}
      {!next && canJump && <JumpButton month={jumpTo}>Ir para hoje</JumpButton>}
      <GridLegend today={months.includes(now.slice(0, 7))} items={[
        { tone: 'night', label: 'Evento' },
        { tone: 'finished', label: 'Finalizado' },
        { tone: 'skipped', label: 'Sem evento (feriado)' },
        { tone: 'holiday', label: 'Feriado' },
      ]} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {months.map((month) => (
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
  const notes = new Map<string, MonthNote>()
  for (const h of holidays) {
    if (!h.cancelled && h.date.startsWith(month)) {
      notes.set(h.date, { date: h.date, tone: 'holiday', text: `Feriado: ${h.name}` })
    }
  }
  for (const e of entries) {
    const day = dayOf(e.starts_at)
    if (!day.startsWith(month)) continue
    notes.set(day, e.night
      ? { date: day, tone: e.night.status === 'finished' ? 'finished' : 'night', text: describe(e), href: `/nights/${e.night.id}` }
      : { date: day, tone: 'skipped', text: describe(e) })
  }
  return [...notes.values()]
}
