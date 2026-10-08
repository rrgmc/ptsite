import { useState } from 'react'
import { Form } from 'react-aria-components'
import { Link } from 'react-router'
import { ApiError, type Season } from '@/api/client'
import { useImportMainEventNight, useMe, usePlaces, usePlayers, useSeasonNights, useStatistics } from '@/api/queries'
import { Button } from '@/components/Button'
import { Card, PageHeader } from '@/components/Card'
import { Badge, Empty, ErrorBox, Loading } from '@/components/Feedback'
import { Select } from '@/components/Select'
import { TextField } from '@/components/TextField'
import { t } from '@/i18n'
import { hasFeature } from '@/lib/features'
import { formatMoney, formatTime, formatWeekday } from '@/lib/format'
import { useSelectedSeason } from '../layout/useSelectedSeason'
import { MainEventPositions } from './MainEventResultCard'
import { playerIdsOf, withEmptyRow } from './order'
import { PlayerOrderFields } from './PlayerOrderFields'

const link = 'inline-flex min-h-touch items-center font-semibold text-primary underline'

/**
 * "Main Event": the Main Event of the season on screen. Its night's date and place, its players in finishing
 * order once it is played, and the season's Main Event pot on a site that has one. Results keepers and admins
 * record here a Main Event that was already played.
 */
export function MainEventPage() {
  const { season, isPending, error } = useSelectedSeason()
  const nights = useSeasonNights(season?.id)
  const statistics = useStatistics(season?.id)
  const me = useMe()
  const [recording, setRecording] = useState(false)

  if (isPending) return <Loading />
  if (error) return <ErrorBox error={error} />
  if (!season) return <Empty>{t.mainEvent.noSeason}</Empty>

  const night = nights.data?.find((n) => n.type === 'main_event' && !n.archived)
  const canRun = Boolean(me.data?.abilities.run_nights)

  return (
    <>
      <PageHeader title={t.mainEvent.title} subtitle={season.name} />

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
          <div className="flex flex-col gap-4">
            <Empty>{t.mainEvent.notScheduled}</Empty>
            {canRun && !recording && (
              <Card>
                {!season.is_finished && (
                  <p className="mb-2">
                    {t.mainEvent.scheduleHelp} <Link to="/results" className={link}>{t.mainEvent.goToResults}</Link>
                  </p>
                )}
                <Button variant="secondary" onPress={() => setRecording(true)}>{t.mainEvent.recordPast}</Button>
              </Card>
            )}
            {canRun && recording && <ImportForm season={season} onDone={() => setRecording(false)} />}
          </div>
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

/** Records a Main Event that was already played: its day, its place and its players in order. */
function ImportForm({ season, onDone }: { season: Season; onDone: () => void }) {
  const places = usePlaces()
  const players = usePlayers()
  const me = useMe()
  const record = useImportMainEventNight(season.id)
  const [date, setDate] = useState('')
  const [time, setTime] = useState(season.schedule.time)
  const [placeId, setPlaceId] = useState<number | null>(season.default_place?.id ?? null)
  const [order, setOrder] = useState(() => withEmptyRow([]))
  const playerIds = playerIdsOf(order)
  const error = record.error instanceof ApiError ? record.error : null

  return (
    <Card title={t.mainEvent.importForm.label}>
      <Form
        aria-label={t.mainEvent.importForm.label}
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (playerIds) record.mutate({ starts_at: `${date} ${time}:00`, place_id: placeId, player_ids: playerIds }, { onSuccess: onDone })
        }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TextField label={t.common.date} type="date" value={date} onChange={setDate} isRequired errorMessage={error?.fieldError('starts_at')} />
          <TextField label={t.mainEvent.importForm.time} type="time" value={time} onChange={setTime} isRequired />
          <Select label={t.common.place} options={(places.data ?? []).map((p) => ({ id: p.id, label: p.name }))} selectedKey={placeId} onSelectionChange={(k) => setPlaceId(k === null ? null : Number(k))} />
        </div>
        <div>
          <p className="mb-3 text-muted">{t.mainEvent.resultForm.help}</p>
          <PlayerOrderFields
            players={players.data ?? []}
            order={order}
            onChange={setOrder}
            fieldError={(field) => error?.fieldError(field)}
            allowQuickAdd={me.data?.abilities.quick_add_players}
          />
        </div>
        {error && !error.fieldError('starts_at') && <p role="alert" className="text-danger">{error.body.message}</p>}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" isDisabled={!playerIds || !date} isPending={record.isPending}>{t.mainEvent.importForm.submit}</Button>
          <Button variant="ghost" onPress={onDone}>{t.common.cancel}</Button>
        </div>
      </Form>
    </Card>
  )
}
