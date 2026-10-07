import { site } from '@/lib/site'
import * as en from './en'
import { withOverrides } from './overrides'
import * as ptBR from './pt-BR'

/**
 * Every text the screens show, by area: `t.auth.logIn`, `t.nights.title({ date })`.
 *
 * - Brazilian Portuguese (./pt-BR) is the reference: its shape is the type every other language must have, so
 *   a missing or misspelled key in ./en fails the type check.
 * - A text is a string, or a function of one object of named values when it has a value in it.
 * - The site's language picks the catalogue (site.locale: "pt…" is Portuguese, anything else English). A site
 *   rewords single texts in its own messages.json (site/README.md).
 * - No component writes a text of its own. `npm run lint` checks that (scripts/check-i18n.mjs).
 */
export type Messages = typeof ptBR

const catalogue: Messages = site.locale.toLowerCase().startsWith('pt') ? ptBR : en

export const t: Messages = withOverrides(catalogue, __SITE_MESSAGES__)

export { plural } from './plural'
