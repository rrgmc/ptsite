import { lazy, Suspense, useState } from 'react'
import { Form } from 'react-aria-components'
import { Link, useNavigate } from 'react-router'
import { ApiError, type SuggestedNight } from '@/api/client'
import { useMe, useNightSuggestions, usePlaces, useScheduleNight, useSeasonNights, useStatistics } from '@/api/queries'
import { Button } from '@/components/Button'
import { Card, PageHeader } from '@/components/Card'
import { Badge, Empty, ErrorBox, Loading } from '@/components/Feedback'
import { Select } from '@/components/Select'
import { TextField } from '@/components/TextField'
import { formatMoney, formatWeekday, formatTime } from '@/lib/format'
import { OpenNightAttendance } from '../attendance/OpenNightAttendance'
import { useSelectedSeason } from '../layout/useSelectedSeason'
import { NightResultCard } from './NightResultCard'
import { NightSuggestions } from './NightSuggestions'
import { suggestionValue } from './suggestionValue'

// The chart loads apart from the page, so the chart library stays out of the main bundle.
const PointsProgressChart = lazy(() => import('../statistics/StatisticsCharts').then((m) => ({ default: m.PointsProgressChart })))

export function ResultsPage() {
  const { season, isPending, error } = useSelectedSeason()
  const nights = useSeasonNights(season?.id)
  const statistics = useStatistics(season?.id)
  const me = useMe()
  const [scheduling, setScheduling] = useState(false)
  const navigate = useNavigate()

  if (isPending) return <Loading />
  if (error) return <ErrorBox error={error} />
  if (!season) return <Empty>Nenhuma temporada cadastrada.</Empty>

  const all = nights.data ?? []
  // Each finished night with its number in the season, newest first.
  const finished = all.filter((n) => n.status === 'finished').map((night, i) => ({ night, number: i + 1 })).reverse()
  const upcoming = all.filter((n) => n.status !== 'finished')
  const canRun = me.data?.abilities.run_nights && !season.is_finished

  return (
    <>
      <OpenNightAttendance />
      <PageHeader title="Resultados" subtitle={season.name} />

      {(upcoming.length > 0 || canRun) && (
        <Card title="Próximos eventos" className="mb-4" action={canRun && !scheduling && <Button variant="secondary" onPress={() => setScheduling(true)}>+ Agendar</Button>}>
          {scheduling && (season.nights_planned ?? 0) >= season.rounds && (
            <p role="alert" className="mb-3 rounded-md bg-warning-soft p-2 text-sm text-warning">
              A temporada já tem {season.nights_planned} eventos de {season.rounds} rodadas. Ainda é possível agendar outro.
            </p>
          )}
          {scheduling && <ScheduleForm seasonId={season.id} defaultPlaceId={season.default_place?.id} defaultTime={season.schedule.time} onDone={(id) => { setScheduling(false); if (id) navigate(`/nights/${id}`) }} />}
          <ul className="flex flex-col gap-1">
            {upcoming.map((n) => (
              <li key={n.id}>
                <Link to={`/nights/${n.id}`} className="flex min-h-touch flex-wrap items-center justify-between gap-x-2 rounded-md px-2 py-1 hover:bg-surface-sunken">
                  <span>
                    <span className="font-semibold">{formatWeekday(n.starts_at)}</span>
                    <span className="text-muted"> · {formatTime(n.starts_at)} · {n.place?.name ?? 'Local a definir'}</span>
                  </span>
                  <Badge tone={n.status === 'open' ? 'primary' : 'neutral'}>{n.status === 'open' ? 'Aberto' : 'Agendado'}</Badge>
                </Link>
              </li>
            ))}
            {upcoming.length === 0 && !scheduling && <li className="text-muted">Nenhum evento agendado.</li>}
          </ul>
        </Card>
      )}

      {statistics.data && statistics.data.nights_count > 0 && (
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[3fr_1fr] lg:items-start">
          {/* min-w-0 lets the chart shrink with its column. */}
          <div className="min-w-0">
            <Suspense fallback={<Loading label="Carregando gráfico…" />}>
              <PointsProgressChart progress={statistics.data.points_progress} perSeason={false} />
            </Suspense>
          </div>
          <Card title="Totais da temporada">
            <dl>
              {([
                ['Pote Total', statistics.data.pot_total],
                ['Pote ME', statistics.data.main_event_pot_total],
                ['Time chip', statistics.data.time_chip_total],
              ] as const).map(([label, amount]) => (
                <div key={label} className="flex items-center justify-between py-0.5">
                  <dt className="font-semibold">{label}</dt>
                  <dd className="tabular">{formatMoney(amount)}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      )}

      {nights.isPending ? (
        <Loading />
      ) : finished.length === 0 ? (
        <Empty>Nenhum evento finalizado nesta temporada.</Empty>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {finished.map(({ night, number }) => <NightResultCard key={night.id} night={night} number={number} />)}
        </div>
      )}
    </>
  )
}

function ScheduleForm({ seasonId, defaultPlaceId, defaultTime, onDone }: { seasonId: number; defaultPlaceId?: number; defaultTime: string; onDone: (nightId?: number) => void }) {
  const suggestions = useNightSuggestions(seasonId)
  if (suggestions.isPending) return <Loading label="Carregando sugestões…" />

  // Start from the first suggestion (usually this week's night); after that the date and time are ordinary fields.
  const regular = suggestions.data?.[0]
  return (
    <ScheduleFields
      seasonId={seasonId}
      suggestions={suggestions.data ?? []}
      initialDate={regular ? suggestionValue(regular).date : ''}
      initialTime={regular ? suggestionValue(regular).time : defaultTime}
      defaultPlaceId={defaultPlaceId}
      onDone={onDone}
    />
  )
}

function ScheduleFields({
  seasonId,
  suggestions,
  initialDate,
  initialTime,
  defaultPlaceId,
  onDone,
}: {
  seasonId: number
  suggestions: SuggestedNight[]
  initialDate: string
  initialTime: string
  defaultPlaceId?: number
  onDone: (nightId?: number) => void
}) {
  const places = usePlaces()
  const schedule = useScheduleNight(seasonId)
  const [date, setDate] = useState(initialDate)
  const [time, setTime] = useState(initialTime)
  const [placeId, setPlaceId] = useState<number | null>(defaultPlaceId ?? null)
  const error = schedule.error instanceof ApiError ? schedule.error : null
  const chosen = suggestions.find((s) => suggestionValue(s).date === date && suggestionValue(s).time === time)

  return (
    <Form
      className="mb-4 grid grid-cols-1 gap-3 rounded-md bg-surface-sunken p-3 sm:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault()
        schedule.mutate({ starts_at: `${date} ${time}:00`, place_id: placeId }, { onSuccess: (night) => onDone(night.id) })
      }}
    >
      {suggestions.length > 0 && (
        <div className="sm:col-span-3">
          <NightSuggestions
            suggestions={suggestions}
            value={chosen?.starts_at ?? null}
            onChange={(s) => {
              setDate(suggestionValue(s).date)
              setTime(suggestionValue(s).time)
            }}
          />
        </div>
      )}
      <TextField label="Data" type="date" value={date} onChange={setDate} isRequired errorMessage={error?.fieldError('starts_at')} />
      <TextField label="Hora" type="time" value={time} onChange={setTime} isRequired />
      <Select label="Local" options={(places.data ?? []).map((p) => ({ id: p.id, label: p.name }))} selectedKey={placeId} onSelectionChange={(k) => setPlaceId(k === null ? null : Number(k))} />
      {error && !error.fieldError('starts_at') && <p role="alert" className="text-danger sm:col-span-3">{error.body.message}</p>}
      <div className="flex gap-2 sm:col-span-3">
        <Button type="submit" isPending={schedule.isPending}>Agendar evento</Button>
        <Button variant="ghost" onPress={() => onDone()}>Cancelar</Button>
      </div>
    </Form>
  )
}
