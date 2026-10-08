import { Link } from 'react-router'
import { useNightDashboard } from '@/api/queries'
import { Card } from '@/components/Card'
import { ErrorBox, Loading } from '@/components/Feedback'
import { t } from '@/i18n'
import { formatMoney } from '@/lib/format'
import type { Amounts } from './dashboardMoney'

/**
 * The night dashboard on the night's page: the amounts so far and the way to the dashboard. It stands where a
 * site without the dashboard shows the partial result.
 */
export function NightDashboardCard({ nightId }: { nightId: number }) {
  const dashboard = useNightDashboard(nightId)

  if (dashboard.isPending) return <Loading />
  if (dashboard.error && !dashboard.data) return <ErrorBox error={dashboard.error} />

  const { totals } = dashboard.data
  const rows: [label: string, amounts: Amounts][] = [
    [t.dashboard.totals.pot, totals.pot],
    ...(totals.time_chip ? [[t.dashboard.totals.timeChip, totals.time_chip] as [string, Amounts]] : []),
    [t.dashboard.totals.total, totals.total],
  ]

  return (
    <Card className="max-w-md" title={t.dashboard.title}>
      <p className="mb-2 text-sm text-muted">{t.dashboard.card.help}</p>
      <dl className="text-sm">
        {rows.map(([label, amounts]) => (
          <div key={label} className="flex items-baseline justify-between gap-2 py-0.5">
            <dt className="font-semibold">{label}</dt>
            <dd className="text-right tabular">
              {formatMoney(amounts.owed)}
              {Number(amounts.pending) > 0 && <span className="ml-2 text-warning">{t.dashboard.totals.pending({ amount: formatMoney(amounts.pending) })}</span>}
            </dd>
          </div>
        ))}
      </dl>
      <Link
        to={`/nights/${nightId}/dashboard`}
        className="mt-3 inline-flex min-h-touch w-full items-center justify-center rounded-md bg-primary px-4 font-semibold text-on-primary hover:bg-primary-hover sm:w-auto"
      >
        {t.dashboard.card.open}
      </Link>
    </Card>
  )
}
