import { Button as AriaButton } from 'react-aria-components'
import { useLocation } from 'react-router'
import { useSeasons } from '@/api/queries'
import { Card, PageHeader } from '@/components/Card'
import { Empty, ErrorBox, Loading } from '@/components/Feedback'
import { t } from '@/i18n'
import { formatDate } from '@/lib/format'
import { SeasonBadge } from './SeasonBadge'
import { usePickSeason } from './usePickSeason'

/**
 * "Escolher temporada": every season, newest first, opened from the season name at the top. Picking one makes it
 * the season that every screen shows.
 */
export function SeasonPickerPage() {
  const seasons = useSeasons()
  const from = (useLocation().state as { from?: string } | null)?.from
  const { pick, selected, defaultSeason } = usePickSeason(from)

  if (seasons.isPending) return <Loading />
  if (seasons.error) return <ErrorBox error={seasons.error} />

  const list = seasons.data!.filter((s) => !s.archived)

  return (
    <>
      <PageHeader title={t.seasons.pickTitle} subtitle={t.seasons.subtitle} />
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
                    <SeasonBadge season={s} isCurrent={s.id === defaultSeason?.id} />
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
