import { useState } from 'react'
import { Form } from 'react-aria-components'
import { Link, useNavigate, useParams } from 'react-router'
import { ApiError, type Night } from '@/api/client'
import { useCancelNight, useMe, useNight, useOpenNight, useRescheduleNight } from '@/api/queries'
import { Button } from '@/components/Button'
import { Card, PageHeader } from '@/components/Card'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Badge, ErrorBox, Loading } from '@/components/Feedback'
import { TextField } from '@/components/TextField'
import { dayOf } from '@/lib/dates'
import { formatTime, formatWeekday, nightTitle } from '@/lib/format'
import { plainText } from '@/lib/plainText'
import { canEditNight } from './canEditNight'
import { NightAttendance } from '../attendance/NightAttendance'
import { NightResultCard } from '../results/NightResultCard'
import { NightPartialResult } from './PartialResultCard'

const statusLabel = { scheduled: 'Agendado', open: 'Aberto', finished: 'Finalizado' } as const
const secondaryLink = 'inline-flex min-h-touch items-center justify-center rounded-md border border-border bg-surface px-4 font-semibold hover:bg-surface-sunken'

export function NightPage() {
  const nightId = Number(useParams().nightId)
  const night = useNight(nightId)
  const me = useMe()
  const open = useOpenNight()
  const cancel = useCancelNight(nightId)
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  if (night.isPending) return <Loading />
  if (night.error) return <ErrorBox error={night.error} />
  const n = night.data!
  const canRun = me.data?.abilities.run_nights
  const canEdit = canEditNight(n, me.data)
  const description = plainText(n.description)

  return (
    <>
      <PageHeader
        title={nightTitle(n.starts_at)}
        subtitle={<span>{formatWeekday(n.starts_at)} · {formatTime(n.starts_at)} · {n.place?.name ?? 'Local a definir'}</span>}
        action={<Badge tone={n.status === 'open' ? 'primary' : 'neutral'}>{statusLabel[n.status]}</Badge>}
      />

      {description && <p className="mb-4 max-w-xl whitespace-pre-line">{description}</p>}

      {canRun && (
        <Card className="mb-4" title="Ações">
          <div className="flex flex-col gap-2 sm:flex-row">
            {n.status === 'scheduled' && !n.archived && (
              <>
                <Button onPress={() => setConfirming(true)}>Abrir evento</Button>
                {!rescheduling && <Button variant="secondary" onPress={() => setRescheduling(true)}>Remarcar</Button>}
                <Button variant="ghost" onPress={() => setCancelling(true)}>Cancelar evento</Button>
              </>
            )}
            {n.archived && <p className="text-muted">Este evento foi cancelado.</p>}
            {n.status === 'open' && <Link to={`/nights/${n.id}/result`} className="inline-flex min-h-touch items-center justify-center rounded-md bg-primary px-4 font-semibold text-on-primary hover:bg-primary-hover">Finalizar: lançar resultado</Link>}
            {n.status === 'finished' && <Link to={`/nights/${n.id}/result`} className={secondaryLink}>Editar resultado</Link>}
            {canEdit && <Link to={`/nights/${n.id}/edit`} className={secondaryLink}>Editar evento</Link>}
          </div>
          {open.error && <div className="mt-3"><ErrorBox error={open.error} /></div>}
          {rescheduling && <RescheduleForm night={n} onDone={() => setRescheduling(false)} />}
        </Card>
      )}

      <div className="mb-4">
        <NightAttendance night={n} />
      </div>

      {n.status === 'finished' ? (
        <div className="max-w-md"><NightResultCard night={n} /></div>
      ) : n.status === 'open' && !n.archived ? (
        <NightPartialResult night={n} />
      ) : (
        <Card><p className="text-muted">O resultado aparece aqui quando o evento for finalizado.</p></Card>
      )}

      <ConfirmDialog
        isOpen={cancelling}
        onOpenChange={setCancelling}
        title="Cancelar este evento?"
        confirmLabel="Cancelar evento"
        cancelLabel="Voltar"
        confirmVariant="danger"
        isPending={cancel.isPending}
        onConfirm={() => cancel.mutate(undefined, { onSuccess: () => navigate('/results'), onSettled: () => setCancelling(false) })}
      >
        O evento sai do calendário e a data fica livre. As respostas de presença ficam guardadas no histórico.
        {cancel.error instanceof ApiError ? ` ${cancel.error.body.message}` : ''}
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={confirming}
        onOpenChange={setConfirming}
        title="Abrir este evento?"
        confirmLabel="Abrir evento"
        isPending={open.isPending}
        onConfirm={() => open.mutate(n.id, { onSettled: () => setConfirming(false) })}
      >
        Só um evento por temporada pode ficar aberto. {open.error instanceof ApiError ? open.error.body.message : ''}
      </ConfirmDialog>
    </>
  )
}

/** "Remarcar": a new date and time for a scheduled night. The place is changed in "Editar evento". */
export function RescheduleForm({ night, onDone }: { night: Night; onDone: () => void }) {
  const reschedule = useRescheduleNight(night.id)
  const [date, setDate] = useState(dayOf(night.starts_at))
  const [time, setTime] = useState(formatTime(night.starts_at))
  const error = reschedule.error instanceof ApiError ? reschedule.error : null

  return (
    <Form
      aria-label="Remarcar evento"
      className="mt-4 grid grid-cols-1 gap-3 rounded-md bg-surface-sunken p-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault()
        reschedule.mutate({ starts_at: `${date} ${time}:00` }, { onSuccess: onDone })
      }}
    >
      <TextField label="Nova data" type="date" value={date} onChange={setDate} isRequired errorMessage={error?.fieldError('starts_at')} />
      <TextField label="Novo horário" type="time" value={time} onChange={setTime} isRequired />
      {error && !error.fieldError('starts_at') && <p role="alert" className="text-danger sm:col-span-2">{error.body.message}</p>}
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" isPending={reschedule.isPending}>Salvar nova data</Button>
        <Button variant="ghost" onPress={onDone}>Voltar</Button>
      </div>
    </Form>
  )
}
