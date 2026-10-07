import { Link } from 'react-router'
import { useAttendance, useMe, useSeasonNights, useStandings } from '@/api/queries'
import { Card, PageHeader } from '@/components/Card'
import { Empty, ErrorBox, Loading } from '@/components/Feedback'
import { formatDate, formatMoney, formatWeekday } from '@/lib/format'
import { OpenNightAttendance } from '../attendance/OpenNightAttendance'
import { useSelectedSeason } from '../layout/useSelectedSeason'
import { StandingsTable } from './StandingsTable'

export function StandingsPage() {
  const { season, isPending, error } = useSelectedSeason()
  const standings = useStandings(season?.id)
  const nights = useSeasonNights(season?.id)

  if (isPending) return <Loading />
  if (error) return <ErrorBox error={error} />
  if (!season) return <Empty>Nenhuma temporada cadastrada.</Empty>

  const finished = (nights.data ?? []).filter((n) => n.status === 'finished')
  const next = (nights.data ?? []).find((n) => n.status === 'open') ?? (nights.data ?? []).find((n) => n.status === 'scheduled')
  const last = finished.at(-1)

  return (
    <>
      <OpenNightAttendance />
      <PageHeader
        title="Classificação"
        subtitle={`${season.name} · ${finished.length} ${finished.length === 1 ? 'evento' : 'eventos'}`}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_20rem]">
        {/* On a phone the table needs the width more than the card needs its padding. */}
        <Card className="max-sm:p-2">
          {standings.isPending ? (
            <Loading />
          ) : standings.error ? (
            <ErrorBox error={standings.error} />
          ) : standings.data!.length === 0 ? (
            <Empty>Ninguém pontuou ainda nesta temporada.</Empty>
          ) : (
            <StandingsTable rows={standings.data!} caption={`Classificação da temporada ${season.name}`} />
          )}
        </Card>

        <div className="flex flex-col gap-4">
          {next && (
            <Card title={next.status === 'open' ? 'Evento aberto' : 'Próximo evento'}>
              <Link to={`/nights/${next.id}`} className="block rounded-md p-2 hover:bg-surface-sunken">
                <span className="block font-semibold">{formatWeekday(next.starts_at)}</span>
                <span className="text-muted">{next.place?.name ?? 'Local a definir'}</span>
                <NextNightAttendance nightId={next.id} isOpen={next.status === 'open'} />
              </Link>
            </Card>
          )}
          {last && (
            <Card title="Último resultado" action={<Link to="/results" className="text-sm font-semibold text-primary">Ver todos</Link>}>
              <Link to={`/nights/${last.id}`} className="block rounded-md p-2 hover:bg-surface-sunken">
                <span className="block font-semibold">{formatDate(last.starts_at)} · Pote {formatMoney(last.pot)}</span>
                <span className="text-muted">🥇 {last.results?.[0]?.player.nickname}</span>
              </Link>
            </Card>
          )}
          <Link to="/simulator" className="rounded-lg border-2 border-dashed border-border p-4 text-center font-semibold text-primary hover:bg-primary-soft">
            🔮 E se…? Simular o próximo evento
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
      {coming} {coming === 1 ? 'vai jogar' : 'vão jogar'} ·{' '}
      {me.data?.player ? (
        mine ? <span className="font-semibold">Você: {mine === 'all_in' ? 'ALL IN' : 'FOLD'}</span> : isOpen ? <span className="font-semibold text-primary">Confirme sua presença</span> : null
      ) : null}
    </span>
  )
}
