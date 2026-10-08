import { Link } from 'react-router'
import { useMe, useSeasonNights, useStatistics } from '@/api/queries'
import { Card, PageHeader } from '@/components/Card'
import { Badge, Empty, ErrorBox, Loading } from '@/components/Feedback'
import { t } from '@/i18n'
import { hasFeature } from '@/lib/features'
import { formatMoney, formatTime, formatWeekday } from '@/lib/format'
import { useSelectedSeason } from '../layout/useSelectedSeason'
import { MainEventPositions } from './MainEventResultCard'

const link = 'inline-flex min-h-touch items-center font-semibold text-primary underline'

/**
 * "Main Event": the Main Event of the season on screen. Its night's date and place, its players in finishing
 * order once it is played, and the season's Main Event pot on a site that has one. An admin adds and edits a
 * season's Main Event in "Administração"; this screen leads there.
 */
export function MainEventPage() {
  const { season, isPending, error } = useSelectedSeason()
  const nights = useSeasonNights(season?.id)
  const statistics = useStatistics(season?.id)
  const me = useMe()

  if (isPending) return <Loading />
  if (error) return <ErrorBox error={error} />
  if (!season) return <Empty>{t.mainEvent.noSeason}</Empty>

  const night = nights.data?.find((n) => n.type === 'main_event' && !n.archived)
  const manage = me.data?.abilities.manage_seasons && (
    <Link to={`/admin/seasons/${season.id}/main-event`} className={link}>{t.mainEvent.manage}</Link>
  )

  return (
    <>
      <PageHeader title={t.mainEvent.title} subtitle={season.name} action={manage} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_20rem] lg:items-start">
        {nights.isPending ? (
          <Loading />
        ) : nights.error ? (
          <ErrorBox error={nights.error} />
        ) : night ? (
          <Card
            title={<Link to={`/nights/${night.id}`} className="hover:underline">{formatWeekday(night.starts_at)}</Link>}
            action={<Badge tone={night.status === 'open' ? 'primary' : 'neutral'}>{t.nights.status[night.status]}</Badge>}
          >
            <p className="-mt-2 mb-3 text-muted">{formatTime(night.starts_at)} · {night.place?.name ?? t.nights.noPlace}</p>
            {night.status === 'finished' ? (
              <MainEventPositions night={night} />
            ) : (
              <>
                <p className="text-muted">{t.mainEvent.notPlayed}</p>
                <Link to={`/nights/${night.id}`} className={link}>{t.mainEvent.seeNight}</Link>
              </>
            )}
          </Card>
        ) : (
          <Empty>{t.mainEvent.notScheduled}</Empty>
        )}

        {hasFeature('mainEventPot') && (
          <Card title={t.mainEvent.potTitle}>
            <p className="font-display text-2xl font-extrabold tabular">{formatMoney(statistics.data?.main_event_pot_total ?? null)}</p>
            <p className="text-sm text-muted">{t.mainEvent.potHelp}</p>
          </Card>
        )}
      </div>
    </>
  )
}
