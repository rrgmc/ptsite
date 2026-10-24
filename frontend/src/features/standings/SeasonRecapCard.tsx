import { useState } from 'react'
import type { SeasonRecap } from '@/api/client'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { formatDate } from '@/lib/format'
import { t } from '@/i18n'

/**
 * "Crônica da temporada": the newest recap, with the older ones behind a button (docs/specs/season-recaps.md,
 * rule 4). Writers and admins also get the drafts, marked as such.
 */
export function SeasonRecapCard({ recaps }: { recaps: SeasonRecap[] }) {
  const [showOlder, setShowOlder] = useState(false)
  const [newest, ...older] = recaps
  if (!newest) return null

  return (
    <Card title={t.standings.recap}>
      <RecapText recap={newest} />
      {older.length > 0 && (
        <>
          <Button variant="ghost" className="mt-2 -ml-4" aria-expanded={showOlder} onPress={() => setShowOlder(!showOlder)}>
            {showOlder ? t.standings.hideOlderRecaps : t.standings.olderRecaps({ count: older.length })}
          </Button>
          {showOlder && (
            <ol className="mt-2 flex flex-col gap-4 border-t border-border pt-4">
              {older.map((recap) => (
                <li key={recap.id}>
                  <RecapText recap={recap} />
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </Card>
  )
}

function RecapText({ recap }: { recap: SeasonRecap }) {
  return (
    <article>
      {(recap.night || !recap.published) && (
        <p className="mb-1 flex flex-wrap items-center gap-2 text-sm text-muted">
          {recap.night && <span>{t.standings.recapAfter({ date: formatDate(recap.night.starts_at) })}</span>}
          {!recap.published && <span className="rounded-sm bg-surface-restricted px-2 font-semibold">{t.standings.recapDraft}</span>}
        </p>
      )}
      <p className="whitespace-pre-line wrap-anywhere">{recap.body}</p>
    </article>
  )
}
