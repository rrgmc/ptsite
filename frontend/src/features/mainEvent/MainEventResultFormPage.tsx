import { useState } from 'react'
import { Form } from 'react-aria-components'
import { Link, useNavigate, useParams } from 'react-router'
import { ApiError, type Night, type Player } from '@/api/client'
import { useAttendance, useFinishMainEventNight, useMe, useNight, usePlayers } from '@/api/queries'
import { Button } from '@/components/Button'
import { Card, PageHeader } from '@/components/Card'
import { Empty, ErrorBox, Loading } from '@/components/Feedback'
import { t } from '@/i18n'
import { titleOfNight } from '@/lib/format'
import { playerIdsOf, withEmptyRow } from './order'
import { PlayerOrderFields } from './PlayerOrderFields'

/**
 * "Finalizar" for a Main Event night: enter or correct the order of its players. Only the 1st place is required.
 * There is no pot and there are no points.
 */
export function MainEventResultFormPage() {
  const nightId = Number(useParams().nightId)
  const night = useNight(nightId)
  const players = usePlayers()

  if (night.isPending || players.isPending) return <Loading />
  if (night.error) return <ErrorBox error={night.error} />
  if (night.data!.type !== 'main_event') return <Empty>{t.mainEvent.resultForm.notMainEvent}</Empty>

  // Keyed so the form starts again from the saved result if the night changes.
  return <MainEventResultForm key={night.data!.id} night={night.data!} players={players.data ?? []} />
}

function MainEventResultForm({ night: n, players }: { night: Night; players: Player[] }) {
  const me = useMe()
  const finish = useFinishMainEventNight(n.id)
  const attendance = useAttendance(n.id)
  // Players who answered ALL IN come first in every picker, in the order they answered.
  const confirmed = { label: t.nights.confirmed, ids: (attendance.data ?? []).filter((a) => a.answer === 'all_in').map((a) => a.player.id) }
  const navigate = useNavigate()
  const [order, setOrder] = useState(() => withEmptyRow((n.main_event_positions ?? []).map((line) => line.player)))
  const playerIds = playerIdsOf(order)
  const apiError = finish.error instanceof ApiError ? finish.error : null

  return (
    <>
      <PageHeader title={n.status === 'finished' ? t.mainEvent.resultForm.titleEdit : t.mainEvent.resultForm.titleFinish} subtitle={titleOfNight(n)} />

      <Form
        className="flex max-w-xl flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (playerIds) finish.mutate({ player_ids: playerIds }, { onSuccess: () => navigate(`/nights/${n.id}`) })
        }}
      >
        <Card title={t.mainEvent.resultTitle}>
          <p className="mb-3 text-muted">{t.mainEvent.resultForm.help}</p>
          <PlayerOrderFields
            players={players}
            order={order}
            onChange={setOrder}
            fieldError={(field) => apiError?.fieldError(field)}
            firstGroup={confirmed}
            allowQuickAdd={me.data?.abilities.quick_add_players}
          />
        </Card>

        {apiError && !Object.keys(apiError.body.errors ?? {}).length && <ErrorBox error={apiError} />}
        {apiError?.fieldError('player_ids') && <p role="alert" className="text-danger">{apiError.fieldError('player_ids')}</p>}

        <div className="sticky bottom-20 flex flex-col gap-2 rounded-lg bg-surface p-3 shadow-raised sm:static sm:flex-row sm:bg-transparent sm:p-0 sm:shadow-none">
          <Button type="submit" isDisabled={!playerIds} isPending={finish.isPending} fullWidth>
            {n.status === 'finished' ? t.mainEvent.resultForm.saveCorrection : t.mainEvent.resultForm.finish}
          </Button>
          <Link to={`/nights/${n.id}`} className="inline-flex min-h-touch items-center justify-center rounded-md px-4 font-semibold text-primary">{t.common.cancel}</Link>
        </div>
      </Form>
    </>
  )
}
