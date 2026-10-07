import { useState } from 'react'
import { Form } from 'react-aria-components'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ApiError, type Season } from '@/api/client'
import { usePlaces, useSaveSeason, useSeasons } from '@/api/queries'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Checkbox } from '@/components/Checkbox'
import { Badge, ErrorBox, Loading } from '@/components/Feedback'
import { Select } from '@/components/Select'
import { TextField } from '@/components/TextField'
import { formatDate } from '@/lib/format'
import { EVERY_WEEKS, WEEKDAYS } from './weekdays'

const STANDARD = [38, 23, 15, 11, 8, 5]

export function SeasonsAdmin() {
  const seasons = useSeasons()
  const navigate = useNavigate()

  if (seasons.isPending) return <Loading />
  if (seasons.error) return <ErrorBox error={seasons.error} />

  return (
    <div className="flex flex-col gap-4">
      <Button className="self-start" onPress={() => navigate('/admin/seasons/new')}>+ Nova temporada</Button>
      <Card>
        <ul className="divide-y divide-border/60">
          {seasons.data!.map((s) => (
            <li key={s.id} className="flex min-h-touch flex-wrap items-center justify-between gap-2 px-2 py-2 even:bg-surface-stripe">
              <span>
                <span className="font-semibold">{s.name}</span>
                <span className="block text-sm text-muted">Início {formatDate(s.starts_on)} · {s.nights_planned ?? 0} de {s.rounds} rodadas ({s.nights_count} finalizadas) · {s.percentages?.map((p) => p.percent).join('/')}% · {WEEKDAYS[s.schedule.weekday - 1]?.label} {s.schedule.time}, {EVERY_WEEKS[s.schedule.every_weeks - 1]?.label.toLowerCase()}</span>
              </span>
              <span className="flex flex-wrap items-center gap-2">
                {s.is_finished ? <Badge>Finalizada</Badge> : s.is_open ? <Badge tone="primary">Aberta</Badge> : <Badge tone="warning">Fechada</Badge>}
                {!s.is_finished && (
                  <Link to={`/admin/seasons/${s.id}/plan`} className="inline-flex min-h-touch items-center rounded-md px-4 font-semibold text-primary hover:bg-primary-soft">
                    Planejar datas
                  </Link>
                )}
                <Button variant="ghost" onPress={() => navigate(`/admin/seasons/${s.id}`)} aria-label={`Editar ${s.name}`}>Editar</Button>
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

/** A season's own page in "Administração": /admin/seasons/new or /admin/seasons/:seasonId. */
export function SeasonEditPage() {
  const { seasonId } = useParams()
  const id = seasonId === 'new' ? undefined : Number(seasonId)
  // The list, not one season: the form's fields come from it, and it is usually loaded already.
  const seasons = useSeasons()
  const season = seasons.data?.find((s) => s.id === id)
  const navigate = useNavigate()
  const location = useLocation()
  // Back to the list where it was left, or to the list itself when this page was opened directly.
  const back = () => (location.key !== 'default' ? navigate(-1) : navigate('/admin'))

  return (
    <div className="flex flex-col gap-3">
      <Link to="/admin" className="inline-flex min-h-touch items-center self-start font-semibold text-primary">‹ Temporadas</Link>
      {id === undefined ? (
        <SeasonForm season={null} onDone={back} />
      ) : seasons.isPending ? (
        <Loading />
      ) : seasons.error ? (
        <ErrorBox error={seasons.error} />
      ) : season ? (
        <SeasonForm key={season.id} season={season} onDone={back} />
      ) : (
        <ErrorBox error={new Error('Temporada não encontrada.')} />
      )}
    </div>
  )
}

function SeasonForm({ season, onDone }: { season: Season | null; onDone: () => void }) {
  const places = usePlaces()
  const save = useSaveSeason()
  const [name, setName] = useState(season?.name ?? '')
  const [startsOn, setStartsOn] = useState(season?.starts_on ?? '')
  const [placeId, setPlaceId] = useState<number | null>(season?.default_place?.id ?? null)
  const [isFinished, setIsFinished] = useState(season?.is_finished ?? false)
  const [weekday, setWeekday] = useState<number | null>(season?.schedule.weekday ?? null)
  const [nightTime, setNightTime] = useState(season?.schedule.time ?? '')
  const [rounds, setRounds] = useState(season ? String(season.rounds) : '')
  const [everyWeeks, setEveryWeeks] = useState<number | null>(season?.schedule.every_weeks ?? null)
  const [percents, setPercents] = useState<string[]>((season?.percentages?.map((p) => p.percent) ?? STANDARD).map(String))
  const total = percents.reduce((sum, p) => sum + (Number(p) || 0), 0)
  const error = save.error instanceof ApiError ? save.error : null

  return (
    <Card title={season ? `Editar ${season.name}` : 'Nova temporada'}>
      <Form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate(
            {
              id: season?.id,
              name,
              starts_on: startsOn,
              default_place_id: placeId,
              is_finished: isFinished,
              is_open: !isFinished,
              percentages: percents.map((p, i) => ({ position: i + 1, percent: Number(p) || 0 })),
              // Left empty on a new season, the API copies the latest season's regular night.
              ...(weekday !== null && { schedule_weekday: weekday }),
              ...(nightTime !== '' && { schedule_time: nightTime }),
              ...(everyWeeks !== null && { schedule_every_weeks: everyWeeks }),
              ...(rounds !== '' && { rounds: Number(rounds) }),
            },
            { onSuccess: onDone },
          )
        }}
      >
        <TextField label="Nome" value={name} onChange={setName} isRequired errorMessage={error?.fieldError('name')} />
        <TextField label="Início" type="date" value={startsOn} onChange={setStartsOn} isRequired errorMessage={error?.fieldError('starts_on')} />
        <TextField
          label="Rodadas"
          description="Quantos eventos a temporada tem (normalmente 26). Vazio na nova temporada: igual à anterior."
          inputMode="numeric"
          value={rounds}
          onChange={setRounds}
          errorMessage={error?.fieldError('rounds')}
        />
        <Select label="Local padrão" options={(places.data ?? []).map((p) => ({ id: p.id, label: p.name }))} selectedKey={placeId} onSelectionChange={(k) => setPlaceId(k === null ? null : Number(k))} />
        <fieldset className="min-w-0 rounded-md border border-border p-3">
          <legend className="px-1 text-sm font-semibold">Evento habitual (usado para sugerir e planejar datas)</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Select label="Dia da semana" options={WEEKDAYS} selectedKey={weekday} onSelectionChange={(k) => setWeekday(k === null ? null : Number(k))} placeholder={season ? 'Selecione' : 'Igual à temporada anterior'} />
            <TextField label="Horário" type="time" value={nightTime} onChange={setNightTime} errorMessage={error?.fieldError('schedule_time')} />
            <Select label="Frequência" options={EVERY_WEEKS} selectedKey={everyWeeks} onSelectionChange={(k) => setEveryWeeks(k === null ? null : Number(k))} placeholder={season ? 'Selecione' : 'Igual à temporada anterior'} />
          </div>
        </fieldset>
        <fieldset className="min-w-0 rounded-md border border-border p-3">
          <legend className="px-1 text-sm font-semibold">Pontuação (% do pote por posição)</legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {percents.map((p, i) => (
              <TextField key={i} label={`${i + 1}º`} inputMode="numeric" value={p} onChange={(v) => setPercents((all) => all.map((x, j) => (j === i ? v : x)))} />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className={total === 100 ? 'text-success' : 'font-semibold text-danger'}>Total: {total}%</span>
            <span className="flex flex-wrap gap-1">
              <Button variant="ghost" onPress={() => setPercents((all) => [...all, '0'])}>+ posição</Button>
              {percents.length > 1 && <Button variant="ghost" onPress={() => setPercents((all) => all.slice(0, -1))}>− posição</Button>}
            </span>
          </div>
          {error?.fieldError('percentages') && <p role="alert" className="mt-1 text-sm text-danger">{error.fieldError('percentages')}</p>}
        </fieldset>
        <Checkbox isSelected={isFinished} onChange={setIsFinished}>Temporada finalizada</Checkbox>
        {error && !error.body.errors && <ErrorBox error={error} />}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" isPending={save.isPending}>Salvar</Button>
          <Button variant="ghost" onPress={onDone}>Cancelar</Button>
        </div>
      </Form>
    </Card>
  )
}
