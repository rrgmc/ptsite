/**
 * Picks the form for a number: plural(2, { one: 'evento', other: 'eventos' }) is "eventos".
 *
 * Only exactly 1 takes `one`. The site writes "0 eventos", in Portuguese too, where the language's own rule
 * (Intl.PluralRules) would say "0 evento". Both languages of the catalogue have these two forms and no more.
 */
export function plural(count: number, forms: { one: string; other: string }): string {
  return count === 1 ? forms.one : forms.other
}
