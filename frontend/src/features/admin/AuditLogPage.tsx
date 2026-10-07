import { useState } from 'react'
import { useAuditLog } from '@/api/queries'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { ErrorBox, Loading } from '@/components/Feedback'
import { site } from '@/lib/site'

const actions: Record<string, string> = {
  'night.scheduled': 'agendou o evento',
  'night.opened': 'abriu o evento',
  'night.finished': 'finalizou o evento',
  'night.corrected': 'corrigiu o resultado do evento',
  'night.imported': 'importou o evento',
  'night.rescheduled': 'remarcou o evento',
  'night.updated': 'editou o evento',
  'night.cancelled': 'cancelou o evento',
  'attendance.set_for_player': 'respondeu a presença por um jogador',
  'holiday.created': 'criou o feriado',
  'holiday.updated': 'alterou o feriado',
  'holiday_exception.created': 'alterou os feriados de um ano',
  'holiday_exception.deleted': 'desfez uma alteração nos feriados de um ano',
  'player.quick_added': 'adicionou rapidamente o jogador',
  'player.created': 'criou o jogador',
  'player.updated': 'alterou o jogador',
  'player.image_saved': 'enviou uma foto do jogador',
  'player.image_removed': 'removeu uma foto do jogador',
  'login.created': 'criou o acesso ao site',
  'login.updated': 'alterou o acesso ao site',
  'login.password_changed': 'alterou a própria senha',
  'login.password_reset_requested': 'enviou um link para redefinir a senha',
  'login.password_reset': 'redefiniu a senha pelo link do e-mail',
  'season.created': 'criou a temporada',
  'season.updated': 'alterou a temporada',
  'place.created': 'criou o local',
  'place.updated': 'alterou o local',
  'v1.imported': 'importou os dados do site anterior',
  'v1.player_images_imported': 'importou as fotos dos jogadores do site anterior',
}

const dateTime = new Intl.DateTimeFormat(site.locale, { dateStyle: 'short', timeStyle: 'short', timeZone: site.timeZone })

/** Who changed what, and the values before and after (docs/decisions/0009-audit-log.md). */
export function AuditLogPage() {
  const [page, setPage] = useState(1)
  const log = useAuditLog(page)

  if (log.isPending) return <Loading />
  if (log.error) return <ErrorBox error={log.error} />
  const { data, meta } = log.data as unknown as { data: import('@/api/client').AuditEntry[]; meta: { current_page: number; last_page: number } }

  return (
    <Card>
      <ol className="divide-y divide-border/60">
        {data.map((entry) => (
          <li key={entry.id} className="px-2 py-3 even:bg-surface-stripe">
            <p>
              <span className="font-semibold">{entry.user?.name ?? 'Sistema'}</span> {actions[entry.action] ?? entry.action}{' '}
              <span className="text-muted">#{entry.subject_id}</span>
            </p>
            <p className="text-sm text-muted">{dateTime.format(new Date(entry.created_at))}</p>
            {(entry.before || entry.after) && (
              <details className="mt-1 text-sm">
                <summary className="cursor-pointer text-primary">Antes e depois</summary>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <pre className="overflow-auto rounded-sm bg-surface-sunken p-2 text-xs">{JSON.stringify(entry.before, null, 1) ?? '—'}</pre>
                  <pre className="overflow-auto rounded-sm bg-surface-sunken p-2 text-xs">{JSON.stringify(entry.after, null, 1)}</pre>
                </div>
              </details>
            )}
          </li>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap justify-between gap-2">
        <Button variant="secondary" isDisabled={page <= 1} onPress={() => setPage((p) => p - 1)}>Anteriores</Button>
        <span className="self-center text-sm text-muted">{meta.current_page} / {meta.last_page}</span>
        <Button variant="secondary" isDisabled={page >= meta.last_page} onPress={() => setPage((p) => p + 1)}>Próximas</Button>
      </div>
    </Card>
  )
}
