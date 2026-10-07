import type { ReactNode } from 'react'
import { SiteFooter } from '@/features/layout/SiteFooter'
import { usePageTitle } from '@/lib/usePageTitle'
import { site } from '@/lib/site'

/**
 * The frame of the screens shown before login: the logo and the site's name above the screen's own content.
 * `title` names the screen in the browser title.
 */
export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  usePageTitle(title)
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
        <div className="mb-8 text-center">
          <div aria-hidden className="mx-auto mb-3 flex size-16 items-center justify-center rounded-lg bg-primary text-3xl text-on-primary">{site.logo}</div>
          <h1 className="font-display text-3xl font-extrabold">{site.name}</h1>
          {site.tagline && <p className="text-muted">{site.tagline}</p>}
        </div>
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}

/** The look of a link that stands alone under a form on these screens. */
export const authLinkClass = 'inline-flex min-h-touch items-center justify-center font-semibold text-primary'
