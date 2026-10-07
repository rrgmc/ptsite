import { isRouteErrorResponse, Link, useRouteError } from 'react-router'
import { t } from '@/i18n'
import { usePageTitle } from '@/lib/usePageTitle'
import { SiteFooter } from './SiteFooter'

/** Shown instead of a blank screen when a page fails to load or crashes. */
export function ErrorPage() {
  const error = useRouteError()
  const notFound = isRouteErrorResponse(error) && error.status === 404
  if (!notFound) console.error(error)
  const title = notFound ? t.layout.errorPage.notFoundTitle : t.layout.errorPage.errorTitle
  usePageTitle(title)

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 text-center">
        <h1 className="font-display text-2xl font-extrabold">{title}</h1>
        <p className="text-muted">
          {notFound ? t.layout.errorPage.notFoundText : t.layout.errorPage.errorText}
        </p>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => window.location.reload()} className="min-h-touch rounded-md bg-primary px-4 font-semibold text-on-primary">
            {t.common.reload}
          </button>
          <Link to="/" className="inline-flex min-h-touch items-center justify-center font-semibold text-primary">{t.layout.errorPage.toStandings}</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
