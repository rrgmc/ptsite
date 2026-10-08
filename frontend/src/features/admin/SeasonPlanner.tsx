import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ApiError, type CalendarHoliday, type PlannedDate, type Season } from '@/api/client'
import { useHolidayCalendars, useNightPlan, useScheduleNights, useSeason } from '@/api/queries'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { ErrorBox, Loading } from '@/components/Feedback'
import { type GridDay, GridLegend, MonthGrid, type MonthNote, MonthNotes } from '@/components/MonthGrid'
import { TextField } from '@/components/TextField'
import { t } from '@/i18n'
import { addDays, dayOf, monthsBetween, today, yearsBetween, zonedDateTime } from '@/lib/dates'
import { usePathOfSeason } from '../layout/useSelectedSeason'
import { EVERY_WEEKS, WEEKDAYS } from './weekdays'

/**
 * "Planejar datas": the season's regular nights between two dates on month calendars, with holidays, emendas and
 * Carnival left out. The admin taps days to tick or untick them, taps any other day to add a night, and schedules
 * them all at once.
 *
 * `today` is today in São Paulo unless given (stories and tests).
 */
export function SeasonPlanner({ today: now = today() }: { today?: string }) {
  const seasonId = Number(useParams().seasonId)
  const season = useSeason(seasonId)
  const pathOfSeason = usePathOfSeason()
  const start = [now, season.data?.starts_on ?? ''].sort()[1]
  const [from, setFrom] = useState<string | null>(null)
  const [to, setTo] = useState<string | null>(null)
  // Kept here, not in the calendar: scheduling refreshes the plan, which starts the calendar again.
  const [scheduled, setScheduled] = useState<number | null>(null)
  const fromValue = from ?? start
  // Until "Até" is typed: plan the rounds the season still needs, or up to the end of the year when none are left.
  const remaining = season.data ? season.data.rounds - (season.data.nights_planned ?? 0) : 0
  const byRounds = to === null && remaining > 0
  const toQuery = byRounds ? addDays(fromValue, 540) : to ?? `${fromValue.slice(0, 4)}-12-31`
  const plan = useNightPlan(seasonId, season.data ? fromValue : '', season.data ? toQuery : '', byRounds ? remaining : undefined)
  const lastPlanned = plan.data?.length ? dayOf(plan.data.at(-1)!.starts_at) : fromValue
  const toValue = byRounds ? (plan.data ? lastPlanned : '') : toQuery
  const holidays = useHolidayCalendars(fromValue && toQuery >= fromValue ? yearsBetween(fromValue, toQuery) : [])

  if (season.isPending) return <Loading />
  if (season.error) return <ErrorBox error={season.error} />
  const s = season.data!

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link to="/admin" className="text-primary underline">{t.admin.seasons.back}</Link>
        <h2 className="mt-2 font-display text-xl font-bold">{t.admin.planner.title({ name: s.name })}</h2>
        <p className="text-muted">
          {t.admin.planner.intro({
            weekday: WEEKDAYS[s.schedule.weekday - 1]?.label ?? '',
            time: s.schedule.time,
            every: EVERY_WEEKS[s.schedule.every_weeks - 1]?.label.toLowerCase() ?? '',
          })}
        </p>
      </div>
      <Card>
        <div className="grid grid-cols-2 gap-3">
          <TextField label={t.admin.planner.from} type="date" value={fromValue} onChange={(v) => { setFrom(v); setScheduled(null) }} />
          <TextField
            label={t.admin.planner.to}
            type="date"
            value={toValue}
            onChange={(v) => { setTo(v); setScheduled(null) }}
            description={to !== null ? undefined : byRounds ? t.admin.planner.toLastRound({ round: s.rounds }) : t.admin.planner.endOfYear}
          />
        </div>
      </Card>
      {scheduled !== null ? (
        <Card>
          <p role="status" className="font-semibold text-success">{t.admin.planner.scheduledCount({ count: scheduled })}</p>
          <Link to={pathOfSeason(seasonId, '/calendar')} className="mt-2 inline-block text-primary underline">{t.admin.planner.viewCalendar}</Link>
        </Card>
      ) : plan.isPending || holidays.isPending ? <Loading label={t.admin.planner.calculating} /> : plan.error ? <ErrorBox error={plan.error} /> : (
        // A new plan starts again from its own ticks.
        <PlanCalendar
          key={`${fromValue}|${toValue}|${plan.dataUpdatedAt}`}
          season={s}
          from={fromValue}
          to={toValue}
          dates={plan.data!}
          holidays={holidays.data}
          onScheduled={setScheduled}
          today={now}
        />
      )}
    </div>
  )
}

function reason(date: PlannedDate): string {
  switch (date.skip_reason?.kind) {
    case 'holiday':
      return t.admin.planner.reasonHoliday({ holiday: date.skip_reason.holiday ?? '' })
    case 'bridge':
      return t.admin.planner.reasonBridge({ holiday: date.skip_reason.holiday ?? '' })
    case 'carnival':
      return t.admin.planner.reasonCarnival
    default:
      return t.admin.planner.reasonRegular
  }
}

export function PlanCalendar({ season, from, to, dates, holidays, onScheduled, today: now = today() }: {
  season: Season
  from: string
  to: string
  dates: PlannedDate[]
  holidays: CalendarHoliday[]
  onScheduled: (count: number) => void
  /** "2027-03-05". Today in São Paulo unless given (stories and tests). */
  today?: string
}) {
  const schedule = useScheduleNights(season.id)
  const [ticked, setTicked] = useState(() => new Set(dates.filter((d) => d.included).map((d) => d.starts_at)))
  const [added, setAdded] = useState<string[]>([])
  const time = season.schedule.time
  const chosen = [...dates.filter((d) => !d.taken && ticked.has(d.starts_at)).map((d) => d.starts_at), ...added].sort()
  const planned = (season.nights_planned ?? 0) + chosen.length
  const error = schedule.error instanceof ApiError ? schedule.error : null
  const months = monthsBetween(from, to)

  const toggle = (startsAt: string, on: boolean) =>
    setTicked((all) => {
      const next = new Set(all)
      if (on) next.add(startsAt)
      else next.delete(startsAt)
      return next
    })

  // Build each day: holidays first, then the plan, then days added by hand.
  const days: Record<string, GridDay> = {}
  for (const h of holidays) {
    if (!h.cancelled) days[h.date] = { tone: 'holiday', label: t.admin.planner.reasonHoliday({ holiday: h.name }) }
  }
  const planDays = new Set(dates.map((d) => dayOf(d.starts_at)))
  for (const d of dates) {
    const day = dayOf(d.starts_at)
    if (d.taken) {
      days[day] = { tone: 'night', label: t.admin.planner.alreadyScheduled, href: d.night_id ? `/nights/${d.night_id}` : undefined }
    } else {
      const on = ticked.has(d.starts_at)
      days[day] = {
        tone: on ? 'planned' : d.skip_reason ? 'skipped' : 'candidate',
        label: on ? t.admin.planner.ticked({ label: reason(d) }) : reason(d),
        onToggle: (selected) => toggle(d.starts_at, selected),
      }
    }
  }
  for (const month of months) {
    for (let n = 1; n <= 31; n++) {
      const day = `${month}-${String(n).padStart(2, '0')}`
      if (day < from || day > to || planDays.has(day)) continue
      const startsAt = zonedDateTime(day, time)
      const on = added.includes(startsAt)
      const holiday = days[day]
      days[day] = {
        tone: on ? 'planned' : holiday?.tone ?? 'plain',
        label: on ? (holiday?.label ? t.admin.planner.extraTickedAfter({ label: holiday.label }) : t.admin.planner.extraTicked) : holiday?.label,
        onToggle: (selected) => setAdded((all) => (selected ? [...all, startsAt] : all.filter((a) => a !== startsAt))),
      }
    }
  }

  return (
    <>
      <Card>
        <p className={`font-semibold ${planned > season.rounds ? 'text-warning' : ''}`}>
          {t.admin.planner.roundsOf({ planned, rounds: season.rounds })}
        </p>
        <p className="text-sm text-muted">{t.admin.planner.planned({ scheduled: season.nights_planned ?? 0, marked: chosen.length })}</p>
        {planned > season.rounds && (
          <p role="alert" className="mt-2 rounded-md bg-warning-soft p-2 text-sm text-warning">
            {t.admin.planner.overPlan({ rounds: season.rounds })}
          </p>
        )}
        <div className="mt-3">
          <GridLegend today={months.includes(now.slice(0, 7))} items={[
            { tone: 'planned', label: t.admin.planner.legendMarked },
            { tone: 'candidate', label: t.admin.planner.legendCandidate },
            { tone: 'skipped', label: t.admin.planner.legendSkipped },
            { tone: 'night', label: t.admin.planner.legendScheduled },
            { tone: 'holiday', label: t.admin.planner.legendHoliday },
          ]} />
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {months.map((month) => (
          <MonthGrid key={month} month={month} days={days} today={now} isDisabled={(d) => d < from || d > to}>
            <MonthNotes notes={planNotes(month, dates, holidays)} />
          </MonthGrid>
        ))}
      </div>
      {error && <ErrorBox error={error} />}
      <div className="sticky bottom-20 z-10 rounded-lg bg-surface p-3 shadow-raised sm:static sm:bg-transparent sm:p-0 sm:shadow-none">
        <Button
          fullWidth
          isDisabled={chosen.length === 0}
          isPending={schedule.isPending}
          onPress={() => schedule.mutate(chosen, { onSuccess: (nights) => onScheduled(nights.length) })}
        >
          {t.admin.planner.schedule({ count: chosen.length })}
        </Button>
      </div>
    </>
  )
}

/** Every holiday of the month, the regular nights it leaves out, and the nights already scheduled. */
function planNotes(month: string, dates: PlannedDate[], holidays: CalendarHoliday[]): MonthNote[] {
  const notes = new Map<string, MonthNote>()
  for (const h of holidays) {
    if (!h.cancelled && h.date.startsWith(month)) notes.set(h.date, { date: h.date, tone: 'holiday', text: t.admin.planner.reasonHoliday({ holiday: h.name }) })
  }
  for (const d of dates) {
    const day = dayOf(d.starts_at)
    if (!day.startsWith(month)) continue
    if (d.taken) {
      notes.set(day, { date: day, tone: 'night', text: t.admin.planner.alreadyScheduled, href: d.night_id ? `/nights/${d.night_id}` : undefined })
    } else if (d.skip_reason) {
      // A Friday that is itself the holiday gets one line.
      notes.set(day, { date: day, tone: 'skipped', text: t.admin.planner.skippedNote({ reason: reason(d) }) })
    }
  }
  return [...notes.values()]
}
