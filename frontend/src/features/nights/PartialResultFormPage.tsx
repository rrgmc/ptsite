import { useState } from 'react'
import { Form } from 'react-aria-components'
import { Link, useParams } from 'react-router'
import { ApiError, type Night, type PartialResult, type Player, type Season } from '@/api/client'
import { useAttendance, useMe, useNight, usePartialResult, usePartialResultSeed, usePlayers, useSavePartialResult, useSeason } from '@/api/queries'
import { Button } from '@/components/Button'
import { Card, PageHeader } from '@/components/Card'
import { ErrorBox, Loading } from '@/components/Feedback'
import { TextField } from '@/components/TextField'
import { formatTime, nightTitle, parseMoneyInput } from '@/lib/format'
import { FinishingOrderFields } from './FinishingOrderFields'
import { seedFromPartial } from './partialResult'

const invalidMoney = 'Valor inválido. Use por exemplo 840 ou 840,50.'
const backLink = 'inline-flex min-h-touch items-center justify-center rounded-md px-4 font-semibold text-primary'

/**
 * "Resultado parcial": active players record what they know of an open night's result while it runs. Every field
 * is optional, and it can be saved any number of times. One per night, shared: the last save wins.
 */
export function PartialResultFormPage() {
  const nightId = Number(useParams().nightId)
  const night = useNight(nightId)
  const season = useSeason(night.data?.season_id ?? 0)
  const players = usePlayers()
  const me = useMe()
  const isOpen = night.data?.status === 'open' && !night.data.archived
  const canSave = Boolean(me.data?.abilities.save_partial_results)
  const seed = usePartialResultSeed(nightId, isOpen && canSave)

  if (night.isPending || season.isPending || players.isPending || me.isPending) return <Loading />
  if (night.error || season.error) return <ErrorBox error={night.error ?? season.error} />

  const header = <PageHeader title="Resultado parcial" subtitle={nightTitle(night.data!.starts_at)} />
  if (!isOpen || !canSave) {
    return (
      <>
        {header}
        <Card className="max-w-xl">
          <p className="text-muted">{isOpen ? 'Só jogadores ativos preenchem o resultado parcial.' : 'Este evento não está aberto.'}</p>
          <Link to={`/nights/${nightId}`} className={`${backLink} mt-2 px-0`}>Voltar ao evento</Link>
        </Card>
      </>
    )
  }
  if (seed.isPending) return <Loading />
  if (seed.error) return <ErrorBox error={seed.error} />

  return (
    <>
      {header}
      {/* Keyed so "Recarregar" starts the form again from what was read. */}
      <PartialResultForm
        key={`${nightId}-${seed.dataUpdatedAt}`}
        night={night.data!}
        season={season.data!}
        players={players.data ?? []}
        initial={seed.data!}
        onReload={() => seed.refetch()}
      />
    </>
  )
}

function PartialResultForm({ night: n, season, players, initial, onReload }: { night: Night; season: Season; players: Player[]; initial: PartialResult; onReload: () => void }) {
  const me = useMe()
  const save = useSavePartialResult(n.id)
  const latest = usePartialResult(n.id)
  const attendance = useAttendance(n.id)
  const confirmed = { label: 'Confirmados', ids: (attendance.data ?? []).filter((a) => a.answer === 'all_in').map((a) => a.player.id) }
  const percentages = season.percentages ?? []

  const [start] = useState(() => seedFromPartial(percentages, initial))
  const [potText, setPotText] = useState(start.potText)
  const [mainEventPotText, setMainEventPotText] = useState(start.mainEventPotText)
  const [timeChipText, setTimeChipText] = useState(start.timeChipText)
  const [order, setOrder] = useState(start.order)
  // The save this form knows about: the one it started from, then its own.
  const [knownSavedAt, setKnownSavedAt] = useState(initial.saved_at)

  const amount = (text: string) => (text.trim() === '' ? null : parseMoneyInput(text))
  const invalid = (text: string) => text.trim() !== '' && parseMoneyInput(text) === null
  const pot = amount(potText)
  const apiError = save.error instanceof ApiError ? save.error : null
  const canSubmit = !invalid(potText) && !invalid(mainEventPotText) && !invalid(timeChipText)
  const savedByOther = latest.data?.saved_at && latest.data.saved_at !== knownSavedAt ? latest.data : null

  function submit() {
    if (!canSubmit) return
    save.mutate(
      {
        pot,
        main_event_pot: amount(mainEventPotText),
        time_chip: amount(timeChipText),
        positions: order.flatMap((p, i) => (p ? [{ position: percentages[i].position, player_id: p.id }] : [])),
      },
      { onSuccess: (saved) => setKnownSavedAt(saved.saved_at) },
    )
  }

  return (
    <Form
      className="flex max-w-xl flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <p className="text-muted">Preencha o que já souber. Qualquer jogador ativo pode alterar; vale o último que salvar.</p>

      {savedByOther && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-warning-soft p-3">
          <span>{savedByOther.saved_by?.name ?? 'Alguém'} salvou às {formatTime(savedByOther.saved_at!)}, depois de você abrir esta tela.</span>
          <Button variant="secondary" onPress={onReload}>Recarregar</Button>
        </div>
      )}

      <Card>
        <div className="flex flex-col gap-3">
          <TextField
            label="Pote (R$)"
            inputMode="decimal"
            value={potText}
            onChange={setPotText}
            placeholder="840,00"
            errorMessage={apiError?.fieldError('pot') ?? (invalid(potText) ? invalidMoney : undefined)}
          />
          <TextField
            label="Pote ME (R$)"
            description="A parte guardada para o Main Event."
            inputMode="decimal"
            value={mainEventPotText}
            onChange={setMainEventPotText}
            placeholder="170,00"
            errorMessage={apiError?.fieldError('main_event_pot') ?? (invalid(mainEventPotText) ? invalidMoney : undefined)}
          />
          <TextField
            label="Time chip (R$)"
            description="Rebuys e atrasos, guardado para a festa de fim de ano."
            inputMode="decimal"
            value={timeChipText}
            onChange={setTimeChipText}
            placeholder="40,00"
            errorMessage={apiError?.fieldError('time_chip') ?? (invalid(timeChipText) ? invalidMoney : undefined)}
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
          clearable
        />
      </Card>

      {apiError && !Object.keys(apiError.body.errors ?? {}).length && <ErrorBox error={apiError} />}
      {apiError?.fieldError('positions') && <p role="alert" className="text-danger">{apiError.fieldError('positions')}</p>}
      {save.isSuccess && !savedByOther && <p role="status" className="font-semibold text-success">Salvo às {formatTime(save.data.saved_at!)}.</p>}

      <div className="sticky bottom-20 flex flex-col gap-2 rounded-lg bg-surface p-3 shadow-raised sm:static sm:flex-row sm:bg-transparent sm:p-0 sm:shadow-none">
        <Button type="submit" isDisabled={!canSubmit} isPending={save.isPending} fullWidth>Salvar resultado parcial</Button>
        <Link to={`/nights/${n.id}`} className={backLink}>Voltar ao evento</Link>
      </div>
    </Form>
  )
}
