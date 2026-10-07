// Reads the site folder (../site, or PTSITE_SITE_DIR) and gives its settings to the build: the values the app
// reads (src/lib/site.ts), the page's title, language and colors, the web app manifest and the icon. See
// site/README.md for the settings.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'
import { brandCss, brandProblems } from './src/site/brand.ts'
import type { SiteFile, SiteSettings } from './src/site/types.ts'

/** The colors of the icon and the installed app's splash screen that are not the brand's. */
const ICON_FOREGROUND = '#f7f7f5'
const APP_BACKGROUND = '#f7f7f5'

/** The demo site, next to this folder. Under Vitest this file has no file address, and the tests run here. */
function demoSiteDir(): string {
  try {
    return fileURLToPath(new URL('../site', import.meta.url))
  } catch {
    return resolve(process.cwd(), '../site')
  }
}

export const siteDir = resolve(process.env.PTSITE_SITE_DIR ?? demoSiteDir())

/** The site's settings, with the defaults filled in. Stops the build with a plain message when one is wrong. */
export function loadSite(dir = siteDir): SiteSettings {
  const file = join(dir, 'site.json')
  if (!existsSync(file)) throw new Error(`No site.json in ${dir}. Set PTSITE_SITE_DIR to the site folder (see site/README.md).`)
  const raw = JSON.parse(readFileSync(file, 'utf8')) as Partial<SiteFile>

  const problems: string[] = []
  for (const key of ['name', 'locale', 'currency', 'timeZone', 'brandColor'] as const) {
    if (typeof raw[key] !== 'string' || raw[key].trim() === '') problems.push(`"${key}" is missing.`)
  }
  if (problems.length === 0) {
    try {
      new Intl.DateTimeFormat(raw.locale, { timeZone: raw.timeZone })
    } catch {
      problems.push(`"locale" (${raw.locale}) or "timeZone" (${raw.timeZone}) is not known.`)
    }
    try {
      const digits = new Intl.NumberFormat(raw.locale, { style: 'currency', currency: raw.currency }).resolvedOptions().maximumFractionDigits
      // The backend keeps money in whole cents.
      if (digits !== 2) problems.push(`"currency" (${raw.currency}) has ${digits} decimal places; only money with two is supported.`)
    } catch {
      problems.push(`"currency" (${raw.currency}) is not an ISO 4217 code.`)
    }
    problems.push(...brandProblems(raw.brandColor!).map((problem) => `"brandColor" (${raw.brandColor}): ${problem}`))
  }
  if (problems.length > 0) throw new Error(`${file}:\n  ${problems.join('\n  ')}`)

  const name = raw.name!.trim()
  const shortName = raw.shortName?.trim() || name
  return {
    name,
    shortName,
    tagline: raw.tagline?.trim() ?? '',
    nightTitlePrefix: raw.nightTitlePrefix?.trim() || shortName,
    logo: raw.logo?.trim() || '♠',
    locale: raw.locale!,
    currency: raw.currency!,
    timeZone: raw.timeZone!,
    brandColor: raw.brandColor!.toLowerCase(),
  }
}

/**
 * The site's own wording: the texts of src/i18n it changes, in its messages.json. No file: no change. A name
 * that is not in the catalogue stops the app when it starts, with the name in the message.
 */
export function loadMessages(dir = siteDir): Record<string, unknown> {
  const file = join(dir, 'messages.json')
  if (!existsSync(file)) return {}
  const messages = JSON.parse(readFileSync(file, 'utf8')) as unknown
  if (typeof messages !== 'object' || messages === null || Array.isArray(messages)) throw new Error(`${file} is not a JSON object.`)
  return messages as Record<string, unknown>
}

/** The web app manifest. `id`, `start_url` and `scope` never change, so an installed app stays the same app. */
export function manifestFor(site: SiteSettings) {
  return {
    id: './',
    name: site.name,
    short_name: site.shortName,
    description: site.tagline || site.name,
    lang: site.locale,
    start_url: './',
    scope: './',
    display: 'standalone',
    background_color: APP_BACKGROUND,
    theme_color: site.brandColor,
    icons: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  }
}

/** The icon: a spade on a rounded square of the main color. `npm run icons` draws the PNG sizes from it. */
export function faviconFor(site: SiteSettings): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${site.brandColor}"/><path d="M32 12c-6 9-16 15-16 24a9 9 0 0 0 14 7.5L27 52h10l-3-8.5A9 9 0 0 0 48 36c0-9-10-15-16-24z" fill="${ICON_FOREGROUND}"/></svg>\n`
}

const TYPES: Record<string, string> = {
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json',
  '.json': 'application/json', '.txt': 'text/plain', '.jpg': 'image/jpeg', '.webp': 'image/webp',
}

/** Every file below a folder, as paths relative to it with forward slashes. */
function filesIn(dir: string, prefix = ''): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    return statSync(path).isDirectory() ? filesIn(path, `${prefix}${name}/`) : [`${prefix}${name}`]
  })
}

/**
 * Puts the site into the build:
 * - the page's title, language, theme color and brand shades (index.html);
 * - manifest.webmanifest and favicon.svg, made from the settings;
 * - the site's theme.css, after the design tokens;
 * - the files of the site's public/ folder, over the frontend's own.
 */
export function sitePlugin(site: SiteSettings): Plugin {
  const generated: Record<string, string> = {
    'manifest.webmanifest': `${JSON.stringify(manifestFor(site), null, 2)}\n`,
    'favicon.svg': faviconFor(site),
  }
  const sitePublic = join(siteDir, 'public')
  const themeFile = join(siteDir, 'theme.css')
  const theme = existsSync(themeFile) ? readFileSync(themeFile, 'utf8') : ''

  return {
    name: 'ptsite-site',
    transformIndexHtml(html) {
      return {
        html: html
          .replace(/<html lang="[^"]*">/, `<html lang="${site.locale}">`)
          .replace(/<title>[^<]*<\/title>/, `<title>${site.name.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</title>`)
          .replace(/(<meta name="theme-color" content=")[^"]*(")/, `$1${site.brandColor}$2`),
        // After the stylesheet, so these values win over the defaults of tokens.css.
        tags: [{ tag: 'style', attrs: { 'data-site': '' }, children: `${brandCss(site.brandColor)}${theme}`, injectTo: 'head' }],
      }
    },
    // The dev server: the site's own files first, then the generated ones.
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = decodeURIComponent((request.url ?? '').split('?')[0]).replace(/^\/app\//, '/').slice(1)
        const own = path && !path.includes('..') ? join(sitePublic, path) : ''
        if (own && existsSync(own) && statSync(own).isFile()) {
          response.setHeader('Content-Type', TYPES[extname(own)] ?? 'application/octet-stream')
          response.end(readFileSync(own))
        } else if (path in generated) {
          response.setHeader('Content-Type', TYPES[extname(path)])
          response.end(generated[path])
        } else {
          next()
        }
      })
    },
    // The build: files of the same name in the frontend's public/ folder are replaced.
    generateBundle() {
      for (const [fileName, source] of Object.entries(generated)) this.emitFile({ type: 'asset', fileName, source })
      for (const fileName of filesIn(sitePublic)) {
        this.emitFile({ type: 'asset', fileName, source: readFileSync(join(sitePublic, fileName)) })
      }
    },
  }
}
