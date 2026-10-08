import { useState } from 'react'
import { Form } from 'react-aria-components'
import { Link, useParams } from 'react-router'
import { ApiError, type Night, type Season } from '@/api/client'
import { useImportMainEventNight, useMe, usePlaces, usePlayers, useScheduleNight, useSeasonNights, useSeasons } from '@/api/queries'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Badge, ErrorBox, Loading } from '@/components/Feedback'
import { Select } from '@/components/Select'
import { TextField } from '@/components/TextField'
import { t } from '@/i18n'
import { formatTime, formatWeekday } from '@/lib/format'
import { MainEventPositions } from '../mainEvent/MainEventResultCard'
import { playerIdsOf, withEmptyRow } from '../mainEvent/order'
import { PlayerOrderFields } from '../mainEvent/PlayerOrderFields'

const link = 'inline-flex min-h-touch items-center justify-center rounded-md border border-border bg-surface px-4 font-semibold hover:bg-surface-sunken'

/**
 * The Main Event of one season, in "Administração": /admin/seasons/:seasonId/main-event. It is the only place
 * where a season gets its Main Event. A season with none shows the form that schedules it, or records it when it
 * was already played. A season with one shows it, with the ways to its night and to its result.
 */
export function MainEventAdmin() {
  const seasonId = Number(useParams().seasonId)
  // The list, not one season: it is usually loaded already.
  const seasons = useSeasons()
  const nights = useSeasonNights(seasonId)
  const season = seasons.data?.find((s) => s.id === seasonId)
  const night = nights.data?.find((n) => n.type === 'main_event' && !n.archived)

  return (
    <div className="flex flex-col gap-3">
      <Link to="/admin" className="inline-flex min-h-touch items-center self-start font-semibold text-primary">{t.admin.seasons.back}</Link>
      {seasons.isPending || nights.isPending ? (
        <Loading />
      ) : seasons.error || nights.error ? (
        <ErrorBox error={seasons.error ?? nights.error} />
      ) : !season ? (
        <ErrorBox error={new Error(t.admin.seasons.notFound)} />
      ) : night ? (
        <MainEventOfSeason season={season} night={night} />
      ) : (
        <AddMainEvent key={season.id} season={season} />
      )}
    </div>
  )
}

function MainEventOfSeason({ season, night }: { season: Season; night: Night }) {
  return (
    <Card
      className="max-w-xl"
      title={t.admin.mainEvent.title({ season: season.name })}
      action={<Badge tone={night.status === 'open' ? 'primary' : 'neutral'}>{t.nights.status[night.status]}</Badge>}
    >
      <p className="font-semibold">{formatWeekday(night.starts_at)}</p>
      <p className="mb-3 text-muted">{formatTime(night.starts_at)} · {night.place?.name ?? t.nights.noPlace}</p>
      {night.status === 'finished' && <MainEventPositions night={night} />}
      {night.status === 'scheduled' && <p className="text-muted">{t.admin.mainEvent.notOpenYet}</p>}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {night.status !== 'scheduled' && (
          <Link to={`/nights/${night.id}/main-event-result`} className={link}>
            {night.status === 'finished' ? t.admin.mainEvent.editResult : t.admin.mainEvent.finish}
          </Link>
        )}
        <Link to={`/nights/${night.id}`} className={link}>{t.admin.mainEvent.seeNight}</Link>
      </div>
      <p className="mt-3 text-sm text-muted">{t.admin.mainEvent.nightHelp}</p>
    </Card>
  )
}

/**
 * Adds the season's Main Event. With no player it is scheduled; with players it is recorded as already played.
 * The date and the time start empty: a Main Event does not follow the season's regular day and time.
 */
function AddMainEvent({ season }: { season: Season }) {
  const places = usePlaces()
  const players = usePlayers()
  const me = useMe()
  const schedule = useScheduleNight(season.id)
  const record = useImportMainEventNight(season.id)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [placeId, setPlaceId] = useState<number | null>(season.default_place?.id ?? null)
  const [order, setOrder] = useState(() => withEmptyRow([]))
  const playerIds = playerIdsOf(order)
  const failure = playerIds ? record.error : schedule.error
  const error = failure instanceof ApiError ? failure : null

  return (
    <Card className="max-w-xl" title={t.admin.mainEvent.title({ season: season.name })}>
      <Form
        aria-label={t.admin.mainEvent.formLabel}
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          const night = { starts_at: `${date} ${time}:00`, place_id: placeId }
          // The list of nights is read again, and this page then shows the Main Event.
          if (playerIds) record.mutate({ ...night, player_ids: playerIds })
          else schedule.mutate({ ...night, type: 'main_event' })
        }}
      >
        <p className="text-muted">{t.admin.mainEvent.intro}</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TextField label={t.common.date} type="date" value={date} onChange={setDate} isRequired errorMessage={error?.fieldError('starts_at')} />
          <TextField label={t.admin.mainEvent.time} type="time" value={time} onChange={setTime} isRequired />
          <Select label={t.common.place} options={(places.data ?? []).map((p) => ({ id: p.id, label: p.name }))} selectedKey={placeId} onSelectionChange={(k) => setPlaceId(k === null ? null : Number(k))} />
        </div>
        <fieldset>
          <legend className="font-display font-bold">{t.admin.mainEvent.orderTitle}</legend>
          <p className="mb-3 text-sm text-muted">{t.admin.mainEvent.orderHelp}</p>
          <PlayerOrderFields
            players={players.data ?? []}
            order={order}
            onChange={setOrder}
            fieldError={(field) => error?.fieldError(field)}
            allowQuickAdd={me.data?.abilities.quick_add_players}
          />
        </fieldset>
        {error && !error.fieldError('starts_at') && <p role="alert" className="text-danger">{error.body.message}</p>}
        <Button type="submit" className="self-start" isDisabled={!date || !time} isPending={schedule.isPending || record.isPending}>
          {playerIds ? t.admin.mainEvent.record : t.admin.mainEvent.schedule}
        </Button>
      </Form>
    </Card>
  )
}
