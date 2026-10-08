import type { ReactNode } from 'react'
import { ToggleButton } from 'react-aria-components'
import { Link } from 'react-router'
import { t } from '@/i18n'
import { monthTitle, monthWeeks, today as currentDay } from '@/lib/dates'
import { formatLongDate, formatWeekday } from '@/lib/format'

/**
 * How a day looks:
 * - planned: a night that will be scheduled (ticked in the planner)
 * - candidate: a regular night left out that can be ticked
 * - night: a scheduled or open night (outlined: still to come)
 * - finished: a finished night (filled: played)
 * - skipped: a regular night not played, because of a holiday
 * - holiday: any other holiday
 */
export type DayTone = 'planned' | 'candidate' | 'night' | 'finished' | 'skipped' | 'holiday' | 'plain'

export interface GridDay {
  tone: DayTone
  /** Read by screen readers after the date, and shown as a tooltip: "Feriado: Tiradentes". */
  label?: string
  /** Opens a page (a night). */
  href?: string
  /** Makes the day a toggle (the planner). */
  onToggle?: (selected: boolean) => void
  /** The next night. */
  highlight?: boolean
}

const tones: Record<DayTone, string> = {
  planned: 'bg-primary text-on-primary font-bold',
  candidate: 'border-2 border-dashed border-primary text-primary',
  night: 'bg-primary-soft text-primary font-bold border-2 border-primary',
  finished: 'bg-primary text-on-primary font-bold',
  skipped: 'bg-warning-soft text-warning line-through',
  holiday: 'bg-accent-soft text-accent font-bold',
  plain: 'text-text',
}

/** The ring around today. It is a shadow, so it sits with a tone's border, the next night's outline and the focus outline. */
const todayRing = (tone: DayTone, disabled: boolean) =>
  `font-extrabold inset-ring-2 ${disabled ? 'inset-ring-muted' : tone === 'planned' || tone === 'finished' ? 'inset-ring-on-primary' : 'inset-ring-text'}`

/** One month as a grid of days, Sunday first. Days can link to a night or be ticked and unticked. Today is ringed, and its month has a tinted background. */
export function MonthGrid({
  month,
  days,
  isDisabled,
  today = currentDay(),
  children,
}: {
  /** "2027-03" */
  month: string
  days: Record<string, GridDay>
  /** Days outside the range shown in a lighter color and not pressable. */
  isDisabled?: (date: string) => boolean
  /** "2027-03-05". Today in São Paulo unless given (stories and tests). */
  today?: string
  /** Shown under the grid: the month's details in words. */
  children?: ReactNode
}) {
  const id = `month-${month}`
  const isCurrentMonth = today.slice(0, 7) === month
  return (
    <section
      aria-labelledby={id}
      data-current-month={isCurrentMonth || undefined}
      className={`rounded-lg p-3 shadow-card sm:p-4 ${isCurrentMonth ? 'bg-surface-current' : 'bg-surface'}`}
    >
      {/* A jump to the month focuses the title and leaves room for the sticky top bar. */}
      <h3 id={id} tabIndex={-1} className="mb-2 scroll-mt-28 font-display text-lg font-bold outline-none">{monthTitle(month)}</h3>
      <table className="w-full table-fixed border-separate border-spacing-0.5 text-center">
        <thead>
          <tr>
            {t.components.monthGrid.weekdays.map(({ short, long }, i) => (
              <th key={i} scope="col" abbr={long} className="text-xs font-semibold text-muted">{short}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {monthWeeks(month).map((week, w) => (
            <tr key={w}>
              {week.map((date, d) => (
                <td key={d} className="p-0" aria-current={date === today ? 'date' : undefined}>
                  {date && <Day date={date} day={days[date]} disabled={isDisabled?.(date) ?? false} isToday={date === today} />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {children}
    </section>
  )
}

function Day({ date, day, disabled, isToday }: { date: string; day?: GridDay; disabled: boolean; isToday: boolean }) {
  const tone = day?.tone ?? 'plain'
  const number = Number(date.slice(8))
  const description = `${formatLongDate(date)}${day?.label ? `: ${day.label}` : ''}${isToday ? ` ${t.components.monthGrid.todayNote}` : ''}`
  const base = [
    // Cells shrink with the screen (7 per row even at 320 px) and stay round.
    'mx-auto flex aspect-square w-full max-w-11 items-center justify-center rounded-full text-sm',
    disabled ? 'text-muted' : tones[tone],
    day?.highlight ? 'outline-3 outline-offset-1 outline-accent' : '',
    isToday ? todayRing(tone, disabled) : '',
  ].join(' ')

  if (!disabled && day?.href) {
    return (
      <Link to={day.href} aria-label={description} title={day.label} className={`${base} focus-visible:outline-3 focus-visible:outline-focus`}>
        {number}
      </Link>
    )
  }
  if (!disabled && day?.onToggle) {
    return (
      <ToggleButton
        aria-label={description}
        isSelected={tone === 'planned'}
        onChange={day.onToggle}
        className={`${base} cursor-pointer focus-visible:outline-3 focus-visible:outline-focus`}
      >
        {number}
      </ToggleButton>
    )
  }
  return (
    <span className={base} title={day?.label}>
      <span aria-hidden>{number}</span>
      <span className="sr-only">{description}</span>
    </span>
  )
}

/** The colors used in a grid, explained. `today` adds "Hoje": pass it when today is on one of the grids. */
export function GridLegend({ items, today = false }: { items: { tone: DayTone; label: string }[]; today?: boolean }) {
  return (
    <ul aria-label={t.components.monthGrid.legend} className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
      {items.map((item) => (
        <li key={item.tone} className="flex items-center gap-2">
          <span aria-hidden className={`inline-flex size-6 items-center justify-center rounded-full text-xs ${tones[item.tone]}`}>9</span>
          {item.label}
        </li>
      ))}
      {today && (
        <li className="flex items-center gap-2">
          <span aria-hidden className={`inline-flex size-6 items-center justify-center rounded-full text-xs ${tones.plain} ${todayRing('plain', false)}`}>9</span>
          {t.common.today}
        </li>
      )}
    </ul>
  )
}

/** A line under a month grid: a day and what happens on it. */
export interface MonthNote {
  /** "2027-04-21" */
  date: string
  text: ReactNode
  tone: DayTone
  /** Makes the date a link (a night). */
  href?: string
}

const dots: Record<DayTone, string> = {
  planned: 'bg-primary',
  candidate: 'border-2 border-dashed border-primary',
  night: 'border-2 border-primary bg-primary-soft',
  finished: 'bg-primary',
  skipped: 'bg-warning',
  holiday: 'bg-accent',
  plain: 'bg-border',
}

/** The month's days in words, in date order, each with its color from the grid. */
export function MonthNotes({ notes }: { notes: MonthNote[] }) {
  if (notes.length === 0) return null
  const sorted = [...notes].sort((a, b) => a.date.localeCompare(b.date))
  return (
    <ul className="mt-3 flex flex-col gap-1 border-t border-border/60 pt-2 text-sm">
      {sorted.map((note) => (
        <li key={`${note.date}-${note.tone}-${note.href ?? ''}`} className="flex items-baseline gap-2">
          <span aria-hidden className={`inline-block size-2.5 shrink-0 rounded-full ${dots[note.tone]}`} />
          <span>
            {note.href ? (
              <Link to={note.href} className="font-semibold text-primary underline">{formatWeekday(note.date)}</Link>
            ) : (
              <span className="font-semibold">{formatWeekday(note.date)}</span>
            )}
            {' · '}{note.text}
          </span>
        </li>
      ))}
    </ul>
  )
}
