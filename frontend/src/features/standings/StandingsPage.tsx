import { Link } from 'react-router'
import { useAttendance, useMe, useSeasonNights, useStandings } from '@/api/queries'
import { Card, PageHeader } from '@/components/Card'
import { Empty, ErrorBox, Loading } from '@/components/Feedback'
import { formatDate, formatMoney, formatWeekday } from '@/lib/format'
import { t } from '@/i18n'
import { OpenNightAttendance } from '../attendance/OpenNightAttendance'
import { NightMark } from '../nights/NightMark'
import { useSelectedSeason } from '../layout/useSelectedSeason'
import { StandingsTable } from './StandingsTable'

export function StandingsPage() {
  const { season, isPending, error } = useSelectedSeason()
  const standings = useStandings(season?.id)
  const nights = useSeasonNights(season?.id)

  if (isPending) return <Loading />
  if (error) return <ErrorBox error={error} />
  if (!season) return <Empty>{t.standings.noSeason}</Empty>

  // The nights with a pot and points. A Main Event night has neither; an extra night is not a round.
  const finished = (nights.data ?? []).filter((n) => n.status === 'finished' && n.type === 'regular')
  const next = (nights.data ?? []).find((n) => n.status === 'open') ?? (nights.data ?? []).find((n) => n.status === 'scheduled')
  const last = finished.at(-1)

  return (
    <>
      <OpenNightAttendance />
      <PageHeader
        title={t.standings.title}
        subtitle={t.standings.subtitle({ season: season.name, count: finished.filter((n) => !n.is_extra).length })}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_20rem]">
        {/* On a phone the table needs the width more than the card needs its padding. */}
        <Card className="max-sm:p-2">
          {standings.isPending ? (
            <Loading />
          ) : standings.error ? (
            <ErrorBox error={standings.error} />
          ) : standings.data!.length === 0 ? (
            <Empty>{t.standings.nobodyScored}</Empty>
          ) : (
            <StandingsTable rows={standings.data!} caption={t.standings.tableCaption({ season: season.name })} />
          )}
        </Card>

        <div className="flex flex-col gap-4">
          {next && (
            <Card title={next.status === 'open' ? t.standings.openNight : t.standings.nextNight}>
              <Link to={`/nights/${next.id}`} className="block rounded-md p-2 hover:bg-surface-sunken">
                <span className="flex flex-wrap items-center gap-2 font-semibold">{formatWeekday(next.starts_at)} <NightMark night={next} /></span>
                <span className="text-muted">{next.place?.name ?? t.standings.placeToBeDefined}</span>
                <NextNightAttendance nightId={next.id} isOpen={next.status === 'open'} />
              </Link>
            </Card>
          )}
          {last && (
            <Card title={t.standings.lastResult} action={<Link to="/results" className="text-sm font-semibold text-primary">{t.standings.seeAll}</Link>}>
              <Link to={`/nights/${last.id}`} className="block rounded-md p-2 hover:bg-surface-sunken">
                <span className="block font-semibold">{t.standings.lastResultLine({ date: formatDate(last.starts_at), pot: formatMoney(last.pot) })}</span>
                <span className="text-muted">🥇 {last.results?.[0]?.player.nickname}</span>
              </Link>
            </Card>
          )}
          <Link to="/simulator" className="rounded-lg border-2 border-dashed border-border p-4 text-center font-semibold text-primary hover:bg-primary-soft">
            {t.standings.simulate}
          </Link>
        </div>
      </div>
    </>
  )
}

/** "3 vão jogar · Você: ALL IN", or a call to answer. A scheduled night takes no answers yet, so it shows nothing. */
function NextNightAttendance({ nightId, isOpen }: { nightId: number; isOpen: boolean }) {
  const me = useMe()
  const attendance = useAttendance(nightId)
  if (!attendance.data || (!isOpen && attendance.data.length === 0)) return null
  const coming = attendance.data.filter((a) => a.answer === 'all_in').length
  const mine = attendance.data.find((a) => a.player.id === me.data?.player?.id)?.answer
  return (
    <span className="mt-1 block text-sm">
      {t.standings.coming({ count: coming })}{' '}
      {me.data?.player ? (
        mine ? <span className="font-semibold">{t.standings.myAnswer({ answer: mine === 'all_in' ? t.attendance.allIn : t.attendance.fold })}</span> : isOpen ? <span className="font-semibold text-primary">{t.standings.confirmPresence}</span> : null
      ) : null}
    </span>
  )
}
