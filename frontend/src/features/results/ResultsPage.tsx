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
import { t } from '@/i18n'
import { formatMoney, formatWeekday, formatTime } from '@/lib/format'
import { OpenNightAttendance } from '../attendance/OpenNightAttendance'
import { MainEventResultCard } from '../mainEvent/MainEventResultCard'
import { amountRows } from '../nights/amounts'
import { NightMark } from '../nights/NightMark'
import { useSelectedSeason } from '../layout/useSelectedSeason'
import { NightResultCard } from './NightResultCard'
import { NightSuggestions } from './NightSuggestions'
import { numberRounds } from './rounds'
import { suggestionValue } from './suggestionValue'

// The chart loads apart from the page, so the chart library stays out of the main bundle.
const PointsProgressChart = lazy(() => import('../statistics/StatisticsCharts').then((m) => ({ default: m.PointsProgressChart })))

/** How many nights "Próximos eventos" lists. */
const UPCOMING = 2

export function ResultsPage() {
  const { season, isPending, error } = useSelectedSeason()
  const nights = useSeasonNights(season?.id)
  const statistics = useStatistics(season?.id)
  const me = useMe()
  const [scheduling, setScheduling] = useState(false)
  const navigate = useNavigate()

  if (isPending) return <Loading />
  if (error) return <ErrorBox error={error} />
  if (!season) return <Empty>{t.results.noSeason}</Empty>

  const all = nights.data ?? []
  // Each finished night with its number in the season, newest first. Only a round has a number.
  const finished = numberRounds(all).reverse()
  // A finished season has nothing to come. An open one shows its next nights only; the calendar has them all.
  const toCome = season.is_finished ? [] : all.filter((n) => n.status !== 'finished')
  const upcoming = toCome.slice(0, UPCOMING)
  const canRun = me.data?.abilities.run_nights && !season.is_finished

  return (
    <>
      <OpenNightAttendance />
      <PageHeader title={t.results.title} subtitle={season.name} />

      {(upcoming.length > 0 || canRun) && (
        <Card title={t.results.upcoming} className="mb-4" action={canRun && !scheduling && <Button variant="secondary" onPress={() => setScheduling(true)}>{t.results.schedule}</Button>}>
          {scheduling && (season.nights_planned ?? 0) >= season.rounds && (
            <p role="alert" className="mb-3 rounded-md bg-warning-soft p-2 text-sm text-warning">
              {t.results.overPlanned({ planned: season.nights_planned ?? 0, rounds: season.rounds })}
            </p>
          )}
          {scheduling && <ScheduleForm seasonId={season.id} defaultPlaceId={season.default_place?.id} defaultTime={season.schedule.time} onDone={(id) => { setScheduling(false); if (id) navigate(`/nights/${id}`) }} />}
          <ul className="flex flex-col gap-1">
            {upcoming.map((n) => (
              <li key={n.id}>
                <Link to={`/nights/${n.id}`} className="flex min-h-touch flex-wrap items-center justify-between gap-x-2 rounded-md px-2 py-1 hover:bg-surface-sunken">
                  <span>
                    <span className="font-semibold">{formatWeekday(n.starts_at)}</span>
                    <span className="text-muted"> · {formatTime(n.starts_at)} · {n.place?.name ?? t.nights.noPlace}</span>
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    <NightMark night={n} />
                    <Badge tone={n.status === 'open' ? 'primary' : 'neutral'}>{n.status === 'open' ? t.nights.status.open : t.nights.status.scheduled}</Badge>
                  </span>
                </Link>
              </li>
            ))}
            {upcoming.length === 0 && !scheduling && <li className="text-muted">{t.results.noUpcoming}</li>}
          </ul>
          {toCome.length > upcoming.length && (
            <Link to="/calendar" className="mt-1 inline-flex min-h-touch items-center px-2 text-sm font-semibold text-primary">{t.results.seeCalendar}</Link>
          )}
        </Card>
      )}

      {statistics.data && statistics.data.nights_count > 0 && (
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[3fr_1fr] lg:items-start">
          {/* min-w-0 lets the chart shrink with its column. */}
          <div className="min-w-0">
            <Suspense fallback={<Loading label={t.results.loadingChart} />}>
              <PointsProgressChart progress={statistics.data.points_progress} perSeason={false} />
            </Suspense>
          </div>
          <Card title={t.results.seasonTotals}>
            <dl>
              {amountRows({
                pot: statistics.data.pot_total,
                mainEventPot: statistics.data.main_event_pot_total,
                timeChip: statistics.data.time_chip_total,
              }).map(([label, amount]) => (
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
        <Empty>{t.results.noFinished}</Empty>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {finished.map(({ night, number }) =>
            night.type === 'main_event' ? <MainEventResultCard key={night.id} night={night} /> : <NightResultCard key={night.id} night={night} number={number} />,
          )}
        </div>
      )}
    </>
  )
}

function ScheduleForm({ seasonId, defaultPlaceId, defaultTime, onDone }: { seasonId: number; defaultPlaceId?: number; defaultTime: string; onDone: (nightId?: number) => void }) {
  const suggestions = useNightSuggestions(seasonId)
  if (suggestions.isPending) return <Loading label={t.results.scheduleForm.loadingSuggestions} />

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

type Kind = 'round' | 'extra'

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
  // A round of the season, or a night outside its calendar. The Main Event is added in "Administração".
  const [kind, setKind] = useState<Kind>('round')
  const kinds = [
    { id: 'round', label: t.results.scheduleForm.kinds.round },
    { id: 'extra', label: t.results.scheduleForm.kinds.extra },
  ]
  const error = schedule.error instanceof ApiError ? schedule.error : null
  const chosen = suggestions.find((s) => suggestionValue(s).date === date && suggestionValue(s).time === time)

  return (
    <Form
      className="mb-4 grid grid-cols-1 gap-3 rounded-md bg-surface-sunken p-3 sm:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault()
        schedule.mutate(
          { starts_at: `${date} ${time}:00`, place_id: placeId, is_extra: kind === 'extra' },
          { onSuccess: (night) => onDone(night.id) },
        )
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
      <TextField label={t.common.date} type="date" value={date} onChange={setDate} isRequired errorMessage={error?.fieldError('starts_at')} />
      <TextField label={t.results.scheduleForm.time} type="time" value={time} onChange={setTime} isRequired />
      <Select label={t.common.place} options={(places.data ?? []).map((p) => ({ id: p.id, label: p.name }))} selectedKey={placeId} onSelectionChange={(k) => setPlaceId(k === null ? null : Number(k))} />
      <div className="sm:col-span-3">
        <Select label={t.results.scheduleForm.kind} options={kinds} selectedKey={kind} onSelectionChange={(k) => setKind((k as Kind | null) ?? 'round')} />
        {kind === 'extra' && <p className="mt-1 text-sm text-muted">{t.results.scheduleForm.extraHelp}</p>}
      </div>
      {error && !error.fieldError('starts_at') && <p role="alert" className="text-danger sm:col-span-3">{error.body.message}</p>}
      <div className="flex gap-2 sm:col-span-3">
        <Button type="submit" isPending={schedule.isPending}>{t.results.scheduleForm.submit}</Button>
        <Button variant="ghost" onPress={() => onDone()}>{t.common.cancel}</Button>
      </div>
    </Form>
  )
}
