import { site } from '@/lib/site'

/** The foot of every page: the version of the site that is running (see RELEASE.md). */
export function SiteFooter({ version = __APP_VERSION__ }: { version?: string }) {
  return (
    <footer className="px-4 py-3 text-center text-xs text-muted">
      {site.name} <span className="tabular">{version}</span>
    </footer>
  )
}
