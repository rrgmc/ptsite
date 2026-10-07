import { useState } from 'react'
import { useAuditLog } from '@/api/queries'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { ErrorBox, Loading } from '@/components/Feedback'
import { t } from '@/i18n'
import { site } from '@/lib/site'

const actions = t.admin.auditLog.actions

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
              <span className="font-semibold">{entry.user?.name ?? t.admin.auditLog.system}</span> {actions[entry.action] ?? entry.action}{' '}
              <span className="text-muted">#{entry.subject_id}</span>
            </p>
            <p className="text-sm text-muted">{dateTime.format(new Date(entry.created_at))}</p>
            {(entry.before || entry.after) && (
              <details className="mt-1 text-sm">
                <summary className="cursor-pointer text-primary">{t.admin.auditLog.beforeAndAfter}</summary>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <pre className="overflow-auto rounded-sm bg-surface-sunken p-2 text-xs">{JSON.stringify(entry.before, null, 1) ?? t.admin.auditLog.empty}</pre>
                  <pre className="overflow-auto rounded-sm bg-surface-sunken p-2 text-xs">{JSON.stringify(entry.after, null, 1)}</pre>
                </div>
              </details>
            )}
          </li>
        ))}
      </ol>
      <div className="mt-3 flex flex-wrap justify-between gap-2">
        <Button variant="secondary" isDisabled={page <= 1} onPress={() => setPage((p) => p - 1)}>{t.admin.auditLog.previous}</Button>
        <span className="self-center text-sm text-muted">{meta.current_page} / {meta.last_page}</span>
        <Button variant="secondary" isDisabled={page >= meta.last_page} onPress={() => setPage((p) => p + 1)}>{t.admin.auditLog.next}</Button>
      </div>
    </Card>
  )
}
