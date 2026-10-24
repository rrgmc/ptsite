import { Link } from 'react-router'
import { Card } from '@/components/Card'
import { t } from '@/i18n'
import { seasonPath, useSeasonPath } from '@/lib/seasonPath'
import { RecapBody } from './RecapBody'
import { recapAnchor, useRecaps } from './useRecaps'

/** On "Classificação": the title of each recap, newest first, each a link to it on the page of recaps. */
export function RecapTitlesBox({ seasonId }: { seasonId: number }) {
  const { views } = useRecaps(seasonId)
  const to = useSeasonPath()
  if (views.length === 0) return null

  return (
    <Card title={t.recaps.listTitle}>
      <ul className="flex flex-col">
        {views.map((view) => (
          <li key={view.recap.id}>
            <Link to={`${to('/recaps')}#${recapAnchor(view.recap)}`} className="block rounded-md px-2 py-1.5 text-sm hover:bg-surface-sunken">
              {view.title}
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}

/** On a night's page: the recap about that night in full, with a link to it on "Crônicas". Nothing without one. */
export function NightRecapBox({ seasonId, nightId }: { seasonId: number; nightId: number }) {
  const { views, nicknames } = useRecaps(seasonId)
  const view = views.find((v) => v.recap.night?.id === nightId)
  if (!view) return null

  return (
    <Card title={t.recaps.ofNight} action={<Link to={`${seasonPath(seasonId, '/recaps')}#${recapAnchor(view.recap)}`} className="text-sm font-semibold text-primary">{t.recaps.seeAll}</Link>}>
      <h3 className="mb-2 font-display font-bold wrap-anywhere">{view.title}</h3>
      <RecapBody text={view.text} nicknames={nicknames} />
    </Card>
  )
}

/** On "Resultados": the newest recap in full, with a link to all of them. */
export function LatestRecapBox({ seasonId }: { seasonId: number }) {
  const { views, nicknames } = useRecaps(seasonId)
  const to = useSeasonPath()
  const latest = views[0]
  if (!latest) return null

  return (
    <Card title={t.recaps.latest} action={<Link to={to('/recaps')} className="text-sm font-semibold text-primary">{t.recaps.seeAll}</Link>}>
      <h3 className="mb-2 font-display font-bold wrap-anywhere">{latest.title}</h3>
      <RecapBody text={latest.text} nicknames={nicknames} />
    </Card>
  )
}
