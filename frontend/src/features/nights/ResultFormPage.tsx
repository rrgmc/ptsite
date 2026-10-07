import { useState } from 'react'
import { Form } from 'react-aria-components'
import { Link, useNavigate, useParams } from 'react-router'
import { ApiError, type Night, type PartialResult, type Player, type Season } from '@/api/client'
import { useAttendance, useFinishNight, useMe, useNight, usePartialResultSeed, usePlayers, useSeason } from '@/api/queries'
import { Button } from '@/components/Button'
import { Card, PageHeader } from '@/components/Card'
import { ErrorBox, Loading } from '@/components/Feedback'
import { TextField } from '@/components/TextField'
import { formatTime, nightTitle, parseMoneyInput } from '@/lib/format'
import { FinishingOrderFields } from './FinishingOrderFields'
import { isEmptyPartial, moneyText, type ResultSeed, seedFromPartial } from './partialResult'
import { currencySymbol } from '@/lib/site'

const invalidMoney = 'Valor inválido. Use por exemplo 840 ou 840,50.'

/**
 * "Finalizar": enter or correct a night's result, designed for a phone at the table.
 * Points are previewed as the pot and order are entered (the Main Event pot and the time chip do not count); the API calculates and checks them again.
 */
export function ResultFormPage() {
  const nightId = Number(useParams().nightId)
  const night = useNight(nightId)
  const season = useSeason(night.data?.season_id ?? 0)
  const players = usePlayers()
  // An open night starts from its partial result, read before the form is shown.
  const isOpen = night.data?.status === 'open'
  const partial = usePartialResultSeed(nightId, isOpen)

  if (night.isPending || season.isPending || players.isPending || (isOpen && partial.isPending)) return <Loading />
  if (night.error || season.error) return <ErrorBox error={night.error ?? season.error} />

  // Keyed so the form starts again from the saved result if the night changes.
  return (
    <ResultForm
      key={night.data!.id}
      night={night.data!}
      season={season.data!}
      players={players.data ?? []}
      partial={isOpen && partial.data && !isEmptyPartial(partial.data) ? partial.data : null}
    />
  )
}

function ResultForm({ night: n, season, players, partial }: { night: Night; season: Season; players: Player[]; partial: PartialResult | null }) {
  const me = useMe()
  const finish = useFinishNight(n.id)
  const attendance = useAttendance(n.id)
  // Players who answered ALL IN come first in every picker, in the order they answered.
  const confirmed = { label: 'Confirmados', ids: (attendance.data ?? []).filter((a) => a.answer === 'all_in').map((a) => a.player.id) }
  const navigate = useNavigate()
  const percentages = season.percentages ?? []

  // Start from the partial result of an open night, or from the saved result when correcting a finished one.
  const [start] = useState<ResultSeed>(() =>
    partial
      ? seedFromPartial(percentages, partial)
      : {
          potText: moneyText(n.pot),
          mainEventPotText: moneyText(n.main_event_pot),
          timeChipText: moneyText(n.time_chip),
          order: percentages.map((p) => n.results?.find((r) => r.position === p.position)?.player ?? null),
        },
  )
  const [potText, setPotText] = useState(start.potText)
  const [mainEventPotText, setMainEventPotText] = useState(start.mainEventPotText)
  const [timeChipText, setTimeChipText] = useState(start.timeChipText)
  const [order, setOrder] = useState(start.order)

  const pot = parseMoneyInput(potText)
  const mainEventPot = parseMoneyInput(mainEventPotText)
  const timeChip = parseMoneyInput(timeChipText)
  const apiError = finish.error instanceof ApiError ? finish.error : null
  const complete = pot !== null && mainEventPot !== null && timeChip !== null && order.every((p) => p !== null)

  function submit() {
    if (!complete) return
    finish.mutate(
      {
        pot: pot!,
        main_event_pot: mainEventPot!,
        time_chip: timeChip!,
        positions: order.map((p, i) => ({ position: percentages[i].position, player_id: p!.id })),
      },
      { onSuccess: () => navigate(`/nights/${n.id}`) },
    )
  }

  return (
    <>
      <PageHeader title={n.status === 'finished' ? 'Editar resultado' : 'Finalizar evento'} subtitle={nightTitle(n.starts_at)} />

      <Form
        className="flex max-w-xl flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        {partial && (
          <p role="status" className="rounded-md bg-primary-soft p-3">
            Preenchido com o resultado parcial salvo por {partial.saved_by?.name ?? 'alguém'} às {formatTime(partial.saved_at!)}. Confira antes de finalizar.
          </p>
        )}

        <Card>
          <div className="flex flex-col gap-3">
            <TextField
              label={`Pote (${currencySymbol})`}
              inputMode="decimal"
              value={potText}
              onChange={setPotText}
              placeholder="840,00"
              isRequired
              errorMessage={apiError?.fieldError('pot') ?? (potText && pot === null ? invalidMoney : undefined)}
            />
            <TextField
              label={`Pote ME (${currencySymbol})`}
              description="A parte guardada para o Main Event. Use 0 se não houve."
              inputMode="decimal"
              value={mainEventPotText}
              onChange={setMainEventPotText}
              placeholder="170,00"
              isRequired
              errorMessage={apiError?.fieldError('main_event_pot') ?? (mainEventPotText && mainEventPot === null ? invalidMoney : undefined)}
            />
            <TextField
              label={`Time chip (${currencySymbol})`}
              description="Rebuys e atrasos, guardado para a festa de fim de ano. Use 0 se não houve."
              inputMode="decimal"
              value={timeChipText}
              onChange={setTimeChipText}
              placeholder="40,00"
              isRequired
              errorMessage={apiError?.fieldError('time_chip') ?? (timeChipText && timeChip === null ? invalidMoney : undefined)}
            />
          </div>
        </Card>

        <Card title="Classificação do evento">
          <FinishingOrderFields
            percentages={percentages}
            players={players}
            order={order}
            onChange={setOrder}
            pot={pot}
            fieldError={(field) => apiError?.fieldError(field)}
            firstGroup={confirmed}
            allowQuickAdd={me.data?.abilities.quick_add_players}
          />
        </Card>

        {apiError && !Object.keys(apiError.body.errors ?? {}).length && <ErrorBox error={apiError} />}
        {apiError?.fieldError('positions') && <p role="alert" className="text-danger">{apiError.fieldError('positions')}</p>}

        <div className="sticky bottom-20 flex flex-col gap-2 rounded-lg bg-surface p-3 shadow-raised sm:static sm:flex-row sm:bg-transparent sm:p-0 sm:shadow-none">
          <Button type="submit" isDisabled={!complete} isPending={finish.isPending} fullWidth>
            {n.status === 'finished' ? 'Salvar correção' : 'Finalizar evento'}
          </Button>
          <Link to={`/nights/${n.id}`} className="inline-flex min-h-touch items-center justify-center rounded-md px-4 font-semibold text-primary">Cancelar</Link>
        </div>
      </Form>
    </>
  )
}
