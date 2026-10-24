import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { PageHeader } from '@/components/Card'
import { Empty, ErrorBox, Loading } from '@/components/Feedback'
import { t } from '@/i18n'
import { nightTitle } from '@/lib/format'
import { useSelectedSeason } from '../layout/useSelectedSeason'
import { NightResultCard } from '../results/NightResultCard'
import { RecapBody } from './RecapBody'
import { recapAnchor, type RecapView, useRecaps } from './useRecaps'

/**
 * "Crônicas": every recap of the season, newest first (docs/specs/season-recaps.md, rule 4). Quick links at the
 * top go to each one. A recap about a night has the night's positions at its left, and its text at the right.
 */
export function RecapsPage() {
  const { season, isPending, error } = useSelectedSeason()
  const { views, nicknames, isPending: recapsPending, error: recapsError } = useRecaps(season?.id)
  const { hash } = useLocation()

  // A link from another screen names one recap: scroll to it once the recaps are on the page.
  useEffect(() => {
    if (hash && views.length > 0) document.getElementById(hash.slice(1))?.scrollIntoView()
  }, [hash, views.length])

  if (isPending || recapsPending) return <Loading />
  if (error || recapsError) return <ErrorBox error={error ?? recapsError} />

  return (
    <>
      <PageHeader title={t.recaps.title} subtitle={season?.name} />
      {views.length === 0 ? (
        <Empty>{t.recaps.none}</Empty>
      ) : (
        <>
          <nav aria-label={t.recaps.jumpTo} className="mb-4 flex flex-wrap gap-2">
            {views.map((view) => (
              <a key={view.recap.id} href={`#${recapAnchor(view.recap)}`} className="inline-flex min-h-touch items-center rounded-full border border-border bg-surface px-3 text-sm font-semibold text-primary hover:bg-primary-soft">
                {shortName(view)}
              </a>
            ))}
          </nav>
          <div className="flex flex-col gap-4">
            {views.map((view) => (
              <RecapArticle key={view.recap.id} view={view} nicknames={nicknames} />
            ))}
          </div>
        </>
      )}
    </>
  )
}

/** The name of a recap in the quick links: its night's title, or "Sobre a temporada". */
function shortName(view: RecapView): string {
  if (view.recap.night) return nightTitle(view.recap.night.starts_at, view.number)
  return t.recaps.aboutSeason
}

function RecapArticle({ view, nicknames }: { view: RecapView; nicknames: string[] }) {
  return (
    // scroll-mt keeps the title clear of the sticky header when a link scrolls to it.
    <section id={recapAnchor(view.recap)} aria-labelledby={`${recapAnchor(view.recap)}-title`} className="scroll-mt-20 rounded-lg bg-surface p-4 shadow-card">
      <header className="mb-3">
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
          {shortName(view)}
          {!view.recap.published && <span className="rounded-sm bg-surface-restricted px-2 font-semibold">{t.recaps.draft}</span>}
        </p>
        <h2 id={`${recapAnchor(view.recap)}-title`} className="font-display text-lg font-bold wrap-anywhere">{view.title}</h2>
      </header>
      <div className={view.night ? 'grid grid-cols-1 gap-4 sm:grid-cols-[15rem_1fr]' : ''}>
        {view.night && (
          <div className="min-w-0 self-start rounded-lg border border-border">
            <NightResultCard night={view.night} number={view.number} compact />
          </div>
        )}
        <RecapBody text={view.text} nicknames={nicknames} />
      </div>
    </section>
  )
}
