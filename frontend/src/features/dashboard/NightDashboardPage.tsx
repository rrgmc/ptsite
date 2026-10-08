import { Link, Navigate, useParams } from 'react-router'
import { ApiError } from '@/api/client'
import { useChangeNightDashboard, useNight, useNightDashboard, usePlayers, useSeason } from '@/api/queries'
import { ErrorBox, Loading } from '@/components/Feedback'
import { t } from '@/i18n'
import { NightDashboardView } from './NightDashboardView'

/**
 * The night dashboard, connected to the API. It asks for the dashboard again every few seconds
 * (useNightDashboard), so the people at the table see each other's changes.
 */
export function NightDashboardPage() {
  const nightId = Number(useParams().nightId)
  const night = useNight(nightId)
  const dashboard = useNightDashboard(nightId)
  const season = useSeason(night.data?.season_id ?? 0)
  const players = usePlayers()
  const change = useChangeNightDashboard(nightId)

  const failed = night.error ?? dashboard.error ?? season.error
  // Shown only when there is no dashboard to show: a refresh that fails later keeps the last one on screen.
  if (failed && !dashboard.data) {
    return (
      <div className="flex flex-col gap-3">
        <ErrorBox error={failed} />
        <Link to={`/nights/${nightId}`} className="inline-flex min-h-touch items-center font-semibold text-primary">{t.dashboard.backToSite}</Link>
      </div>
    )
  }
  if (!night.data || !dashboard.data || !season.data) return <Loading />

  return (
    <NightDashboardView
      night={night.data}
      dashboard={dashboard.data}
      percentages={season.data.percentages ?? []}
      players={players.data ?? []}
      error={change.error ? (change.error instanceof ApiError ? change.error.body.message : t.components.connectionError) : undefined}
      onChange={(next) => change.mutate(next)}
    />
  )
}

/** Where the partial result's form leads on a site with the dashboard, which holds the partial result. */
export function ToNightDashboard() {
  return <Navigate to={`/nights/${useParams().nightId}/dashboard`} replace />
}
