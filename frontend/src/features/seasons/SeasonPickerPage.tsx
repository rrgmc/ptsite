import { useLocation } from 'react-router'
import type { Season } from '@/api/client'
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

  const status = (s: Season) => (
    <>
      <SeasonBadge season={s} isCurrent={s.id === defaultSeason?.id} />
      {s.id === selected?.id && <span className="text-sm font-semibold whitespace-nowrap text-primary">{t.seasons.selected}</span>}
    </>
  )

  return (
    <>
      <PageHeader title={t.seasons.pickTitle} subtitle={t.seasons.subtitle} />
      {list.length === 0 ? (
        <Empty>{t.seasons.noSeason}</Empty>
      ) : (
        <Card title={t.seasons.listTitle}>
          {/* On a narrow screen the table scrolls sideways inside its card instead of widening the page. "relative" keeps the
            headings that only screen readers get inside the scrolling area. A phone hides the two counts. */}
          <div className="relative overflow-x-auto">
            <table className="w-full border-collapse">
              <caption className="sr-only">{t.seasons.listTitle}</caption>
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted">
                  <th scope="col" className="px-2 py-2">{t.seasons.columns.season}</th>
                  <th scope="col" className="px-2 py-2">{t.seasons.columns.start}</th>
                  <th scope="col" className="hidden px-2 py-2 text-right sm:table-cell">{t.seasons.columns.nights}</th>
                  <th scope="col" className="hidden px-2 py-2 text-right sm:table-cell">{t.seasons.columns.finished}</th>
                  <th scope="col" className="px-2 py-2">{t.seasons.columns.status}</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  // The button in the first cell picks the season for everyone; a click anywhere on the row does the same.
                  <tr
                    key={s.id}
                    onClick={() => pick(s)}
                    aria-current={s.id === selected?.id ? 'true' : undefined}
                    className="cursor-pointer border-b border-border/60 last:border-0 even:bg-surface-stripe hover:bg-surface-sunken"
                  >
                    <th scope="row" className="px-2 py-1 text-left">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          pick(s)
                        }}
                        className="min-h-touch rounded-md text-left font-semibold wrap-anywhere hover:underline focus-visible:outline-3 focus-visible:outline-focus"
                      >
                        {s.name}
                      </button>
                    </th>
                    <td className="px-2 py-1 whitespace-nowrap tabular">{formatDate(s.starts_on)}</td>
                    <td className="hidden px-2 py-1 text-right tabular sm:table-cell">{s.nights_planned ?? 0}</td>
                    <td className="hidden px-2 py-1 text-right tabular sm:table-cell">{s.nights_count ?? 0}</td>
                    <td className="px-2 py-1">
                      <span className="flex flex-wrap items-center gap-x-2">{status(s)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  )
}
