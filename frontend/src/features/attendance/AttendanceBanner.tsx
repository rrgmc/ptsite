import { Link } from 'react-router'
import type { Night } from '@/api/client'
import { Button } from '@/components/Button'
import { formatWeekday } from '@/lib/format'
import type { Answer } from './AttendancePanel'

const labels: Record<Answer, string> = { all_in: 'ALL IN', fold: 'FOLD' }

/**
 * The open night, above a season screen: a player who has not answered taps ALL IN or FOLD; one who has sees the
 * answer, with the way to the night's page to change it (docs/specs/attendance.md, rule 8).
 */
export function AttendanceBanner({
  night,
  answer,
  onAnswer,
  error,
}: {
  night: Night
  /** The logged-in player's answer; null when there is none yet. */
  answer: Answer | null
  onAnswer: (answer: Answer) => void
  error?: string
}) {
  const nightPath = `/nights/${night.id}`
  return (
    <aside aria-label="Evento aberto" className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md bg-primary-soft p-3">
      <p className="min-w-0 wrap-anywhere">
        <Link to={nightPath} className="font-semibold underline">Evento aberto: {formatWeekday(night.starts_at)}</Link>
        <span className="text-muted"> · {night.place?.name ?? 'Local a definir'}</span>
        <span className="block">
          {answer ? <>Você: <strong>{labels[answer]}</strong></> : 'Confirme sua presença'}
        </span>
      </p>
      {answer ? (
        <Link to={nightPath} className="flex min-h-touch items-center rounded-md px-2 font-semibold text-primary underline">Alterar</Link>
      ) : (
        <div className="flex gap-2">
          <Button onPress={() => onAnswer('all_in')}>{labels.all_in}</Button>
          <Button variant="secondary" onPress={() => onAnswer('fold')}>{labels.fold}</Button>
        </div>
      )}
      {error && <p role="alert" className="w-full text-danger">{error}</p>}
    </aside>
  )
}
