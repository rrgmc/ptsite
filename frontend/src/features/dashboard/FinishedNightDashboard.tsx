import type { Night } from '@/api/client'
import { useNightDashboard } from '@/api/queries'
import { ErrorBox, Loading } from '@/components/Feedback'
import { NightResultCard } from '../results/NightResultCard'
import { DashboardPlayersCard } from './DashboardPlayersCard'

/**
 * A finished night with a dashboard, on the night's page: the result, with the rebuys and late arrivals the dashboard
 * counted, and beside it what each player paid. On a phone the players come under the result.
 */
export function FinishedNightDashboard({ night }: { night: Night }) {
  const dashboard = useNightDashboard(night.id)
  const data = dashboard.data
  const counts = data && {
    rebuys: data.players.reduce((count, line) => count + line.rebuys.length, 0),
    // Only the players who arrived late: the time chip a rebuy pays is not counted.
    lateArrivals: data.totals.time_chip !== null ? data.players.filter((line) => line.time_chip).length : null,
  }

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
      <NightResultCard night={night} counts={counts} />
      {dashboard.isPending ? (
        <Loading />
      ) : !data ? (
        <ErrorBox error={dashboard.error} />
      ) : (
        data.players.length > 0 && <DashboardPlayersCard dashboard={data} />
      )}
    </div>
  )
}
