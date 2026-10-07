import { site } from '@/lib/site'

const rules = new Intl.PluralRules(site.locale)

/**
 * Picks the form for a number, by the site's language: plural(2, { one: 'evento', other: 'eventos' }) is
 * "eventos". `other` is the form for every case a language has and the texts do not name.
 */
export function plural(count: number, forms: { one: string; other: string; zero?: string }): string {
  const rule = rules.select(count)
  return (rule === 'zero' ? forms.zero : rule === 'one' ? forms.one : undefined) ?? forms.other
}
