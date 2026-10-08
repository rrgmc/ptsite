import { Link } from 'react-router'
import type { Night } from '@/api/client'
import { Button } from '@/components/Button'
import { t } from '@/i18n'
import { hasFeature } from '@/lib/features'
import { rich } from '@/i18n/rich'
import { formatWeekday } from '@/lib/format'
import { NightMark } from '../nights/NightMark'
import type { Answer } from './AttendancePanel'

const labels: Record<Answer, string> = { all_in: t.attendance.allIn, fold: t.attendance.fold }

/**
 * The open night, above a season screen: a player who has not answered taps ALL IN or FOLD; one who has sees the
 * answer, with the way to the night's page to change it (docs/specs/attendance.md, rule 8). On a site with the
 * night dashboard, a regular night also has the way to it.
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
    <aside aria-label={t.attendance.banner.label} className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md bg-primary-soft p-3">
      <p className="min-w-0 wrap-anywhere">
        <Link to={nightPath} className="font-semibold underline">{t.attendance.banner.title({ weekday: formatWeekday(night.starts_at) })}</Link>
        <span className="text-muted"> · {night.place?.name ?? t.nights.noPlace}</span> <NightMark night={night} />
        <span className="block">
          {answer ? rich(t.attendance.banner.you, { answer: <strong>{labels[answer]}</strong> }) : t.attendance.banner.confirmPresence}
        </span>
      </p>
      {answer ? (
        <Link to={nightPath} className="flex min-h-touch items-center rounded-md px-2 font-semibold text-primary underline">{t.attendance.banner.change}</Link>
      ) : (
        <div className="flex gap-2">
          <Button onPress={() => onAnswer('all_in')}>{labels.all_in}</Button>
          <Button variant="secondary" onPress={() => onAnswer('fold')}>{labels.fold}</Button>
        </div>
      )}
      {hasFeature('nightDashboard') && night.type !== 'main_event' && (
        <Link to={`${nightPath}/dashboard`} className="flex min-h-touch w-full items-center font-semibold text-primary underline">{t.dashboard.title}</Link>
      )}
      {error && <p role="alert" className="w-full text-danger">{error}</p>}
    </aside>
  )
}
