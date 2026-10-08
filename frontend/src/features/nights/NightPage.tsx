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
import { t } from '@/i18n'
import { dayOf } from '@/lib/dates'
import { formatTime, formatWeekday, titleOfNight } from '@/lib/format'
import { plainText } from '@/lib/plainText'
import { canEditNight } from './canEditNight'
import { NightAttendance } from '../attendance/NightAttendance'
import { usePathOfSeason } from '../layout/useSelectedSeason'
import { MainEventResultCard } from '../mainEvent/MainEventResultCard'
import { NightResultCard } from '../results/NightResultCard'
import { NightMark } from './NightMark'
import { NightPartialResult } from './PartialResultCard'

const statusLabel = t.nights.status
const secondaryLink = 'inline-flex min-h-touch items-center justify-center rounded-md border border-border bg-surface px-4 font-semibold hover:bg-surface-sunken'

export function NightPage() {
  const nightId = Number(useParams().nightId)
  const night = useNight(nightId)
  const me = useMe()
  const open = useOpenNight()
  const cancel = useCancelNight(nightId)
  const navigate = useNavigate()
  const pathOfSeason = usePathOfSeason()
  const [confirming, setConfirming] = useState(false)
  const [rescheduling, setRescheduling] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  if (night.isPending) return <Loading />
  if (night.error) return <ErrorBox error={night.error} />
  const n = night.data!
  const canRun = me.data?.abilities.run_nights
  const canEdit = canEditNight(n, me.data)
  const description = plainText(n.description)
  // A Main Event night has a result of its own: the order of its players, with no pot.
  const isMainEvent = n.type === 'main_event'
  const resultPath = `/nights/${n.id}/${isMainEvent ? 'main-event-result' : 'result'}`

  return (
    <>
      <PageHeader
        title={titleOfNight(n)}
        subtitle={<span>{formatWeekday(n.starts_at)} · {formatTime(n.starts_at)} · {n.place?.name ?? t.nights.noPlace}</span>}
        action={
          <span className="flex flex-wrap items-center gap-2">
            <NightMark night={n} />
            <Badge tone={n.status === 'open' ? 'primary' : 'neutral'}>{statusLabel[n.status]}</Badge>
          </span>
        }
      />

      {description && <p className="mb-4 max-w-xl whitespace-pre-line">{description}</p>}

      {canRun && (
        <Card className="mb-4" title={t.nights.page.actions}>
          <div className="flex flex-col gap-2 sm:flex-row">
            {n.status === 'scheduled' && !n.archived && (
              <>
                <Button onPress={() => setConfirming(true)}>{t.nights.page.openNight}</Button>
                {!rescheduling && <Button variant="secondary" onPress={() => setRescheduling(true)}>{t.nights.page.reschedule}</Button>}
                <Button variant="ghost" onPress={() => setCancelling(true)}>{t.nights.page.cancelNight}</Button>
              </>
            )}
            {n.archived && <p className="text-muted">{t.nights.nightCancelled}</p>}
            {n.status === 'open' && <Link to={resultPath} className="inline-flex min-h-touch items-center justify-center rounded-md bg-primary px-4 font-semibold text-on-primary hover:bg-primary-hover">{t.nights.page.finishEnterResult}</Link>}
            {n.status === 'finished' && <Link to={resultPath} className={secondaryLink}>{t.nights.page.editResult}</Link>}
            {canEdit && <Link to={`/nights/${n.id}/edit`} className={secondaryLink}>{t.nights.editNight}</Link>}
          </div>
          {open.error && <div className="mt-3"><ErrorBox error={open.error} /></div>}
          {rescheduling && <RescheduleForm night={n} onDone={() => setRescheduling(false)} />}
        </Card>
      )}

      <div className="mb-4">
        <NightAttendance night={n} />
      </div>

      {isMainEvent ? (
        n.status === 'finished' ? (
          <div className="max-w-md"><MainEventResultCard night={n} /></div>
        ) : (
          <Card><p className="text-muted">{t.mainEvent.resultPlaceholder}</p></Card>
        )
      ) : n.status === 'finished' ? (
        <div className="max-w-md"><NightResultCard night={n} /></div>
      ) : n.status === 'open' && !n.archived ? (
        <NightPartialResult night={n} />
      ) : (
        <Card><p className="text-muted">{t.nights.page.resultPlaceholder}</p></Card>
      )}

      <ConfirmDialog
        isOpen={cancelling}
        onOpenChange={setCancelling}
        title={t.nights.page.cancelConfirmTitle}
        confirmLabel={t.nights.page.cancelNight}
        cancelLabel={t.common.back}
        confirmVariant="danger"
        isPending={cancel.isPending}
        onConfirm={() => cancel.mutate(undefined, { onSuccess: () => navigate(pathOfSeason(n.season_id, '/results')), onSettled: () => setCancelling(false) })}
      >
        {t.nights.page.cancelConfirmBody}
        {cancel.error instanceof ApiError ? ` ${cancel.error.body.message}` : ''}
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={confirming}
        onOpenChange={setConfirming}
        title={t.nights.page.openConfirmTitle}
        confirmLabel={t.nights.page.openNight}
        isPending={open.isPending}
        onConfirm={() => open.mutate(n.id, { onSettled: () => setConfirming(false) })}
      >
        {t.nights.page.openConfirmBody} {open.error instanceof ApiError ? open.error.body.message : ''}
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
      aria-label={t.nights.reschedule.formLabel}
      className="mt-4 grid grid-cols-1 gap-3 rounded-md bg-surface-sunken p-3 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault()
        reschedule.mutate({ starts_at: `${date} ${time}:00` }, { onSuccess: onDone })
      }}
    >
      <TextField label={t.nights.reschedule.newDate} type="date" value={date} onChange={setDate} isRequired errorMessage={error?.fieldError('starts_at')} />
      <TextField label={t.nights.reschedule.newTime} type="time" value={time} onChange={setTime} isRequired />
      {error && !error.fieldError('starts_at') && <p role="alert" className="text-danger sm:col-span-2">{error.body.message}</p>}
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" isPending={reschedule.isPending}>{t.nights.reschedule.save}</Button>
        <Button variant="ghost" onPress={onDone}>{t.common.back}</Button>
      </div>
    </Form>
  )
}
