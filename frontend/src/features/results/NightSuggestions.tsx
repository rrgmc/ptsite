import { Label, Radio, RadioGroup } from 'react-aria-components'
import type { SuggestedNight } from '@/api/client'
import { formatWeekday } from '@/lib/format'
import { suggestionValue } from './suggestionValue'

/** "esta semana", "próxima semana" or "em 2 semanas", counting Monday-to-Sunday weeks from today. */
function weekLabel(startsAt: string, today = new Date()): string {
  const monday = (d: Date) => {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
    return x
  }
  const [y, m, d] = suggestionValue({ starts_at: startsAt }).date.split('-').map(Number)
  const weeks = Math.round((monday(new Date(y, m - 1, d)).getTime() - monday(today).getTime()) / (7 * 24 * 3600 * 1000))
  if (weeks <= 0) return 'esta semana'
  return weeks === 1 ? 'próxima semana' : `em ${weeks} semanas`
}

/**
 * Suggested dates for a new night (docs/specs/seasons-and-nights.md): the next three regular weekdays at the
 * regular time. Choosing one fills the date and time; they can still be changed.
 */
export function NightSuggestions({
  suggestions,
  value,
  onChange,
  today,
}: {
  suggestions: SuggestedNight[]
  value: string | null
  onChange: (suggestion: SuggestedNight) => void
  /** For stories and tests; defaults to now. */
  today?: Date
}) {
  return (
    <RadioGroup
      value={value}
      onChange={(startsAt) => {
        const s = suggestions.find((x) => x.starts_at === startsAt)
        if (s) onChange(s)
      }}
      className="flex flex-col gap-2"
    >
      <Label className="text-sm font-semibold">Sugestões</Label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {suggestions.map((s) => (
          <Radio
            key={s.starts_at}
            value={s.starts_at}
            className="flex min-h-touch cursor-pointer flex-col justify-center rounded-md border border-border bg-surface px-3 py-2 outline-none selected:border-primary selected:bg-primary-soft focus-visible:outline-3 focus-visible:outline-focus"
          >
            <span className="font-semibold">{formatWeekday(s.starts_at)}</span>
            <span className="text-sm text-muted">
              {suggestionValue(s).time} · {weekLabel(s.starts_at, today)}
            </span>
          </Radio>
        ))}
      </div>
    </RadioGroup>
  )
}
