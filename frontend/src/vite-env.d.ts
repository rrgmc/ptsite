/** The site's version, set at build time by vite.config.ts: the release tag, or `git describe` between releases. */
declare const __APP_VERSION__: string

/** The site's settings, set at build time by vite.config.ts from the site folder. Read them through src/lib/site.ts. */
declare const __SITE__: import('./site/types').SiteSettings

/** The site's own wording, from its messages.json. Read the texts through src/i18n. */
declare const __SITE_MESSAGES__: import('./i18n/overrides').MessageOverrides
