import type { SiteSettings } from '@/site/types'

/**
 * This site's settings: its name, language, money, time zone and main color. They come from the site folder's
 * site.json when the app is built (site-settings.ts, site/README.md). Everything that names the site or formats
 * a value reads them from here.
 */
export const site: SiteSettings = __SITE__

/** The sign of the site's money, for a field label: "R$". */
export const currencySymbol =
  new Intl.NumberFormat(site.locale, { style: 'currency', currency: site.currency })
    .formatToParts(0)
    .find((part) => part.type === 'currency')?.value ?? site.currency
