import { Button as AriaButton } from 'react-aria-components'
import { useLocation, useNavigate } from 'react-router'
import type { Season } from '@/api/client'
import { useSeasons } from '@/api/queries'
import { Card, PageHeader } from '@/components/Card'
import { Badge, Empty, ErrorBox, Loading } from '@/components/Feedback'
import { t } from '@/i18n'
import { formatDate } from '@/lib/format'
import { setSelectedSeasonId } from '@/lib/selectedSeason'
import { isSeasonScreen } from '../layout/navigation'
import { useSelectedSeason } from '../layout/useSelectedSeason'

/** "Temporadas": every season, newest first. Picking one makes it the season that every screen shows. */
export function SeasonsPage() {
  const seasons = useSeasons()
  const { season: selected, defaultSeason } = useSelectedSeason()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from

  if (seasons.isPending) return <Loading />
  if (seasons.error) return <ErrorBox error={seasons.error} />

  const list = seasons.data!.filter((s) => !s.archived)

  function pick(season: Season) {
    // The current season is "no pick", so the site follows the next season when it opens.
    setSelectedSeasonId(season.id === defaultSeason?.id ? null : season.id)
    navigate(isSeasonScreen(from) ? from : '/')
  }

  return (
    <>
      <PageHeader title={t.common.seasons} subtitle={t.seasons.subtitle} />
      {list.length === 0 ? (
        <Empty>{t.seasons.noSeason}</Empty>
      ) : (
        <Card>
          <ul className="divide-y divide-border/60">
            {list.map((s) => (
              <li key={s.id} className="even:bg-surface-stripe">
                <AriaButton
                  onPress={() => pick(s)}
                  aria-current={s.id === selected?.id ? 'true' : undefined}
                  className="flex min-h-touch w-full flex-wrap items-center justify-between gap-2 rounded-md px-2 py-2 text-left hover:bg-surface-sunken focus-visible:outline-3 focus-visible:outline-focus"
                >
                  <span className="min-w-0 wrap-anywhere">
                    <span className="font-semibold">{s.name}</span>
                    <span className="block text-sm text-muted">
                      {t.seasons.started({ date: formatDate(s.starts_on), count: s.nights_count ?? 0 })}
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    {s.id === selected?.id && <span className="text-sm font-semibold text-primary">{t.seasons.selected}</span>}
                    {s.id === defaultSeason?.id ? (
                      <Badge tone="primary">{t.seasons.current}</Badge>
                    ) : s.is_finished ? (
                      <Badge>{t.seasons.finished}</Badge>
                    ) : s.is_open ? (
                      <Badge tone="primary">{t.seasons.open}</Badge>
                    ) : (
                      <Badge tone="warning">{t.seasons.closed}</Badge>
                    )}
                  </span>
                </AriaButton>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}
